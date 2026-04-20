import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.document import document_crud
from app.crud.profile import profile_crud
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.schemas.document import DocumentCreate, DocumentOut, DocumentUpdate

UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png"}

router = APIRouter(tags=["documents"])


@router.get("/profiles/{profile_id}/documents", response_model=list[DocumentOut])
def list_documents(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if not profile_crud.get(db, profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")
    return document_crud.get_by_profile(db, profile_id)


@router.post(
    "/profiles/{profile_id}/documents",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    profile_id: uuid.UUID,
    body: DocumentCreate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if not profile_crud.get(db, profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")
    return document_crud.create_for_profile(db, profile_id=profile_id, obj_in=body)


@router.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    doc = document_crud.get(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.put("/documents/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: uuid.UUID,
    body: DocumentUpdate,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    doc = document_crud.get(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_crud.update(db, db_obj=doc, obj_in=body)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if not document_crud.delete(db, id=document_id):
        raise HTTPException(status_code=404, detail="Document not found")


@router.post("/documents/{document_id}/file", status_code=204)
async def upload_file(
    document_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG files are allowed")
    doc = document_crud.get(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.file_path:
        Path(doc.file_path).unlink(missing_ok=True)
    ext = ALLOWED_TYPES[file.content_type]
    path = UPLOADS_DIR / f"{document_id}{ext}"
    contents = await file.read()
    path.write_bytes(contents)
    doc.file_name = file.filename
    doc.file_path = str(path)
    db.commit()
    return Response(status_code=204)


@router.get("/documents/{document_id}/file")
def download_file(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    doc = document_crud.get(db, document_id)
    if not doc or not doc.file_path:
        raise HTTPException(status_code=404, detail="File not found")
    ext = Path(doc.file_path).suffix.lower()
    media_map = {".pdf": "application/pdf", ".jpg": "image/jpeg", ".png": "image/png"}
    media_type = media_map.get(ext, "application/octet-stream")
    return FileResponse(doc.file_path, filename=doc.file_name, media_type=media_type)


@router.delete("/documents/{document_id}/file", status_code=204)
def delete_file(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    doc = document_crud.get(db, document_id)
    if not doc or not doc.file_path:
        raise HTTPException(status_code=404, detail="File not found")
    Path(doc.file_path).unlink(missing_ok=True)
    doc.file_name = None
    doc.file_path = None
    db.commit()
    return Response(status_code=204)
