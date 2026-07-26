"""add cloudinary fields to teachers and therapists

Revision ID: d1e2f3a4b5c6
Revises: c0d1e2f3a4b5
Create Date: 2026-07-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'c0d1e2f3a4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('teachers', sa.Column('photo_url', sa.String(), nullable=True))
    op.add_column('teachers', sa.Column('photo_public_id', sa.String(), nullable=True))
    op.add_column('therapists', sa.Column('photo_url', sa.String(), nullable=True))
    op.add_column('therapists', sa.Column('photo_public_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('therapists', 'photo_public_id')
    op.drop_column('therapists', 'photo_url')
    op.drop_column('teachers', 'photo_public_id')
    op.drop_column('teachers', 'photo_url')
