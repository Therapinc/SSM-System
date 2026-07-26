"""add cloudinary fields to students

Revision ID: c0d1e2f3a4b5
Revises: aaaa2222bbbb3333
Create Date: 2026-07-25 10.38 am

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0d1e2f3a4b5'
down_revision: Union[str, None] = 'aaaa2222bbbb3333'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('students', sa.Column('photo_url', sa.String(), nullable=True))
    op.add_column('students', sa.Column('photo_public_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'photo_public_id')
    op.drop_column('students', 'photo_url')