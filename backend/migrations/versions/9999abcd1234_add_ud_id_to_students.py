"""add ud_id to students

Revision ID: 9999abcd1234
Revises: a65fb55baae5
Create Date: 2026-05-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9999abcd1234'
down_revision: Union[str, None] = 'fcc813cfaed8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add `ud_id` column to students for Unique Disability ID
    op.add_column('students', sa.Column('ud_id', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove the `ud_id` column on downgrade
    op.drop_column('students', 'ud_id')
