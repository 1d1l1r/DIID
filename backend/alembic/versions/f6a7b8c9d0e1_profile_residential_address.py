"""Add residential address, preserving the existing registered address."""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('addresses_match', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('profiles', sa.Column('residential_address', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'residential_address')
    op.drop_column('profiles', 'addresses_match')
