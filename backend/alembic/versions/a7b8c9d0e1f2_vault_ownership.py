"""Isolate each user's vault and assign legacy records to the master."""
from alembic import op
from app.db.ownership_v1 import upgrade_ownership

revision = 'a7b8c9d0e1f2'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    upgrade_ownership(op.get_bind())


def downgrade() -> None:
    raise RuntimeError('Removing ownership would merge private vaults. Restore a pre-upgrade backup instead.')
