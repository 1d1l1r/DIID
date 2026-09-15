import uuid
from fastapi import HTTPException
from typing import Any, Generic, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any, *, owner_id: uuid.UUID) -> ModelType | None:
        return db.query(self.model).filter(self.model.id == id, self.model.owner_id == owner_id).first()

    def create(self, db: Session, *, obj_in: CreateSchemaType, owner_id: uuid.UUID) -> ModelType:
        obj = self.model(owner_id=owner_id, **obj_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def update(self, db: Session, *, db_obj: ModelType, obj_in: UpdateSchemaType, owner_id: uuid.UUID) -> ModelType:
        self.require_owner(db_obj, owner_id)
        for field, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: Any, owner_id: uuid.UUID) -> bool:
        obj = self.get(db, id, owner_id=owner_id)
        if not obj:
            return False
        db.delete(obj)
        db.commit()
        return True

    @staticmethod
    def require_owner(obj: ModelType, owner_id: uuid.UUID) -> None:
        if obj.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Record not found")
