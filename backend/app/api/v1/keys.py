import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.key_entry import key_crud
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.schemas.key_entry import KeyCreate, KeyOut, KeyUpdate

UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_KEY_EXTENSIONS = {".p12", ".pfx"}

router = APIRouter(prefix="/keys", tags=["keys"])


@router.get("", response_model=list[KeyOut])
def list_keys(
    profile_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    return key_crud.get_list(db, profile_id=profile_id)


@router.post("", response_model=KeyOut, status_code=status.HTTP_201_CREATED)
def create_key(
    body: KeyCreate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    return key_crud.create(db, obj_in=body)


@router.get("/{key_id}", response_model=KeyOut)
def get_key(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    entry = key_crud.get(db, key_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Key not found")
    return entry


@router.put("/{key_id}", response_model=KeyOut)
def update_key(
    key_id: uuid.UUID,
    body: KeyUpdate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    entry = key_crud.get(db, key_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Key not found")
    return key_crud.update(db, db_obj=entry, obj_in=body)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_key(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    entry = key_crud.get(db, key_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Key not found")
    if entry.file_path:
        Path(entry.file_path).unlink(missing_ok=True)
    if not key_crud.delete(db, id=key_id):
        raise HTTPException(status_code=404, detail="Key not found")


@router.post("/{key_id}/file", response_model=KeyOut)
def upload_key_file(
    key_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    entry = key_crud.get(db, key_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Key not found")

    original_name = file.filename or ""
    ext = Path(original_name).suffix.lower()
    if ext not in ALLOWED_KEY_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .p12 and .pfx files are supported")

    # Remove old file if exists
    if entry.file_path:
        Path(entry.file_path).unlink(missing_ok=True)

    file_path = UPLOADS_DIR / f"key_{key_id}{ext}"
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return key_crud.update(db, db_obj=entry, obj_in=KeyUpdate(
        file_name=original_name,
        file_path=str(file_path),
    ))


@router.get("/{key_id}/file")
def download_key_file(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    entry = key_crud.get(db, key_id)
    if not entry or not entry.file_path:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = Path(entry.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        filename=entry.file_name or file_path.name,
        media_type="application/x-pkcs12",
    )


@router.delete("/{key_id}/file", response_model=KeyOut)
def delete_key_file(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    entry = key_crud.get(db, key_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Key not found")
    if entry.file_path:
        Path(entry.file_path).unlink(missing_ok=True)
    return key_crud.update(db, db_obj=entry, obj_in=KeyUpdate(file_name=None, file_path=None))
