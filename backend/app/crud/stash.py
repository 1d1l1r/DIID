import uuid

from sqlalchemy.orm import Session, selectinload

from app.crud.base import CRUDBase
from app.models.stash import Stash, StashImage
from app.schemas.stash import StashCreate, StashUpdate


class CRUDStash(CRUDBase[Stash, StashCreate, StashUpdate]):
    def get_list(self, db: Session) -> list[Stash]:
        return (
            db.query(Stash)
            .options(selectinload(Stash.images))
            .order_by(Stash.created_at.desc())
            .all()
        )

    def get_with_images(self, db: Session, stash_id: uuid.UUID) -> Stash | None:
        return (
            db.query(Stash)
            .options(selectinload(Stash.images))
            .filter(Stash.id == stash_id)
            .first()
        )

    def count_images(self, db: Session, stash_id: uuid.UUID) -> int:
        return db.query(StashImage).filter(StashImage.stash_id == stash_id).count()

    def add_image(
        self,
        db: Session,
        stash_id: uuid.UUID,
        file_name: str,
        file_path: str,
        order: int,
    ) -> StashImage:
        img = StashImage(
            stash_id=stash_id,
            file_name=file_name,
            file_path=file_path,
            order=order,
        )
        db.add(img)
        db.commit()
        db.refresh(img)
        return img

    def get_image(self, db: Session, image_id: uuid.UUID) -> StashImage | None:
        return db.query(StashImage).filter(StashImage.id == image_id).first()

    def delete_image(self, db: Session, image: StashImage) -> None:
        db.delete(image)
        db.commit()


stash_crud = CRUDStash(Stash)
