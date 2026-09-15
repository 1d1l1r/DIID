import uuid

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate


class CRUDDocument(CRUDBase[Document, DocumentCreate, DocumentUpdate]):
    def get_by_profile(self, db: Session, profile_id: uuid.UUID, *, owner_id: uuid.UUID) -> list[Document]:
        return db.query(Document).filter(Document.profile_id == profile_id, Document.owner_id == owner_id).all()

    def create_for_profile(
        self, db: Session, *, profile_id: uuid.UUID, obj_in: DocumentCreate, owner_id: uuid.UUID
    ) -> Document:
        doc = Document(owner_id=owner_id, profile_id=profile_id, **obj_in.model_dump())
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc


document_crud = CRUDDocument(Document)
