"""add new document types

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-20 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(sa.text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'diploma'"))
    op.execute(sa.text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'birth_certificate'"))
    op.execute(sa.text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'power_of_attorney'"))
    op.execute(sa.text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'scan'"))
    op.execute(sa.text("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'photo'"))


def downgrade():
    pass  # PostgreSQL doesn't support removing enum values
