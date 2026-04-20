from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_session
from app.crud.search import search_all
from app.db.session import get_db
from app.models.session import Session as DBSession
from app.schemas.search import SearchResults

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResults)
def search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    _: DBSession = Depends(get_current_session),
):
    return search_all(db, q)
