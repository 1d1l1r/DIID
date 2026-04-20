import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.document import document_crud
from app.crud.profile import profile_crud
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.schemas.document import DocumentCreate, DocumentOut, DocumentUpdate

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
