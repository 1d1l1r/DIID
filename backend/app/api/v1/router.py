from fastapi import APIRouter

from app.api.v1 import auth, cards, documents, keys, passwords, profiles, search, settings

router = APIRouter()
router.include_router(auth.router)
router.include_router(profiles.router)
router.include_router(documents.router)
router.include_router(cards.router)
router.include_router(passwords.router)
router.include_router(keys.router)
router.include_router(search.router)
router.include_router(settings.router)
