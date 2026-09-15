import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.document import Document
from app.models.key_entry import KeyEntry
from app.models.password_entry import PasswordEntry
from app.models.profile import Profile
from app.models.session import Session as DBSession
from app.models.stash import Stash, StashImage
from app.models.user import User
from app.models.user_settings import UserSettings


def delete_user_vault(db: Session, user: User) -> None:
    # Imported at call time to respect the desktop upload-directory overrides.
    from app.api.v1 import documents, keys, stashes
    files = []
    for model, root in ((Document, documents.UPLOADS_DIR), (KeyEntry, keys.UPLOADS_DIR)):
        files.extend((row.file_path, root) for row in db.query(model).filter(model.owner_id == user.id) if row.file_path)
    owned_stashes = db.query(Stash.id).filter(Stash.owner_id == user.id)
    images = db.query(StashImage).filter(StashImage.stash_id.in_(owned_stashes))
    files.extend((row.file_path, stashes.UPLOADS_DIR) for row in images)
    images.delete(synchronize_session=False)
    for model in (Document, Card, PasswordEntry, KeyEntry, Profile, Stash):
        db.query(model).filter(model.owner_id == user.id).delete(synchronize_session=False)
    db.query(DBSession).filter(DBSession.user_id == user.id).delete(synchronize_session=False)
    db.query(UserSettings).filter(UserSettings.user_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    for filename, root in files:
        path = Path(filename).resolve()
        # Legacy records could contain paths submitted through the old KeyUpdate API.
        if not path.is_relative_to(root.resolve()):
            logging.warning('Skipped attachment cleanup outside the uploads directory')
            continue
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logging.exception('Failed to remove an inaccessible attachment after deleting its account')
