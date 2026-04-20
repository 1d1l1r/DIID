"""add document file fields

Revision ID: a1b2c3d4e5f6
Revises: 7eb0c9b2b856
Create Date: 2026-04-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '7eb0c9b2b856'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('file_name', sa.String(length=255), nullable=True))
    op.add_column('documents', sa.Column('file_path', sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'file_path')
    op.drop_column('documents', 'file_name')
