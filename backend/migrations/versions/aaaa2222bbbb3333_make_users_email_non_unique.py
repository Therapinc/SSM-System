"""Make users email non-unique to allow dual-role accounts

Revision ID: aaaa2222bbbb3333
Revises: 47e464c2e770
Create Date: 2026-07-21 19:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aaaa2222bbbb3333'
down_revision: Union[str, None] = '47e464c2e770'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the unique index on users.email and replace with a non-unique index.
    # This allows the same person to have two separate login accounts
    # (one as teacher, one as therapist) sharing the same real email address.
    op.drop_index('ix_users_email', table_name='users')
    op.create_index('ix_users_email', 'users', ['email'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_email', table_name='users')
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
