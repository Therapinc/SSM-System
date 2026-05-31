"""add therapist student assignments

Revision ID: b1c2d3e4f5a6
Revises: 74e78d266220
Create Date: 2026-05-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "74e78d266220"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "therapist_student_assignments",
        sa.Column("therapist_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["therapist_id"], ["therapists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("therapist_id", "student_id"),
    )
    op.create_index(
        op.f("ix_therapist_student_assignments_student_id"),
        "therapist_student_assignments",
        ["student_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_therapist_student_assignments_student_id"),
        table_name="therapist_student_assignments",
    )
    op.drop_table("therapist_student_assignments")