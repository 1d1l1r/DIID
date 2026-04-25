import mimetypes
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.stash import stash_crud
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.schemas.stash import StashCreate, StashOut, StashUpdate

UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"}
MAX_IMAGES = 5

router = APIRouter(prefix="/stashes", tags=["stashes"])


@router.get("", response_model=list[StashOut])
def list_stashes(
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    return stash_crud.get_list(db)


@router.post("", response_model=StashOut, status_code=status.HTTP_201_CREATED)
def create_stash(
    body: StashCreate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    stash = stash_crud.create(db, obj_in=body)
    return stash_crud.get_with_images(db, stash.id)


@router.get("/{stash_id}", response_model=StashOut)
def get_stash(
    stash_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    stash = stash_crud.get_with_images(db, stash_id)
    if not stash:
        raise HTTPException(status_code=404, detail="Stash not found")
    return stash


@router.put("/{stash_id}", response_model=StashOut)
def update_stash(
    stash_id: uuid.UUID,
    body: StashUpdate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    stash = stash_crud.get_with_images(db, stash_id)
    if not stash:
        raise HTTPException(status_code=404, detail="Stash not found")
    stash_crud.update(db, db_obj=stash, obj_in=body)
    return stash_crud.get_with_images(db, stash_id)


@router.delete("/{stash_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stash(
    stash_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    stash = stash_crud.get_with_images(db, stash_id)
    if not stash:
        raise HTTPException(status_code=404, detail="Stash not found")
    for img in stash.images:
        Path(img.file_path).unlink(missing_ok=True)
    if not stash_crud.delete(db, id=stash_id):
        raise HTTPException(status_code=404, detail="Stash not found")


@router.post("/{stash_id}/images", response_model=StashOut)
def upload_stash_image(
    stash_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    stash = stash_crud.get_with_images(db, stash_id)
    if not stash:
        raise HTTPException(status_code=404, detail="Stash not found")

    count = stash_crud.count_images(db, stash_id)
    if count >= MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES} images allowed")

    original_name = file.filename or "image"
    ext = Path(original_name).suffix.lower()
    if not ext:
        ext = ".jpg"
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only image files (JPG, PNG, GIF, WebP, HEIC) are supported",
        )

    image_id = uuid.uuid4()
    file_path = UPLOADS_DIR / f"stash_{stash_id}_{image_id}{ext}"
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    stash_crud.add_image(
        db,
        stash_id=stash_id,
        file_name=original_name,
        file_path=str(file_path),
        order=count,
    )
    return stash_crud.get_with_images(db, stash_id)


@router.get("/{stash_id}/images/{image_id}")
def get_stash_image(
    stash_id: uuid.UUID,
    image_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    img = stash_crud.get_image(db, image_id)
    if not img or img.stash_id != stash_id:
        raise HTTPException(status_code=404, detail="Image not found")

    file_path = Path(img.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found on disk")

    media_type, _ = mimetypes.guess_type(img.file_name)
    return FileResponse(
        path=str(file_path),
        media_type=media_type or "image/jpeg",
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.delete("/{stash_id}/images/{image_id}", response_model=StashOut)
def delete_stash_image(
    stash_id: uuid.UUID,
    image_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    img = stash_crud.get_image(db, image_id)
    if not img or img.stash_id != stash_id:
        raise HTTPException(status_code=404, detail="Image not found")

    Path(img.file_path).unlink(missing_ok=True)
    stash_crud.delete_image(db, img)
    return stash_crud.get_with_images(db, stash_id)
