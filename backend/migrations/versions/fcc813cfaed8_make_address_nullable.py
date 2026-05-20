"""make address nullable

Revision ID: fcc813cfaed8
Revises: eeee5555ffff6666
Create Date: 2026-05-20 22:43:58.113837
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "fcc813cfaed8"
down_revision: Union[str, None] = "eeee5555ffff6666"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Teachers
    op.alter_column(
        "teachers",
        "address",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "date_of_birth",
        existing_type=sa.DATE(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "gender",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "blood_group",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "mobile_number",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "religion",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "caste",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "rci_number",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "rci_renewal_date",
        existing_type=sa.DATE(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "qualifications_details",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "teachers",
        "category",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    # Therapists
    op.alter_column(
        "therapists",
        "address",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "date_of_birth",
        existing_type=sa.DATE(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "gender",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "blood_group",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "mobile_number",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "religion",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "caste",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "rci_number",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "rci_renewal_date",
        existing_type=sa.DATE(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "qualifications_details",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )

    op.alter_column(
        "therapists",
        "category",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )


def downgrade() -> None:
    # Therapists
    op.alter_column(
        "therapists",
        "category",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "qualifications_details",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "rci_renewal_date",
        existing_type=sa.DATE(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "rci_number",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "caste",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "religion",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "mobile_number",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "blood_group",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "gender",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "date_of_birth",
        existing_type=sa.DATE(),
        nullable=False,
    )

    op.alter_column(
        "therapists",
        "address",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    # Teachers
    op.alter_column(
        "teachers",
        "category",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "qualifications_details",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "rci_renewal_date",
        existing_type=sa.DATE(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "rci_number",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "caste",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "religion",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "mobile_number",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "blood_group",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "gender",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "date_of_birth",
        existing_type=sa.DATE(),
        nullable=False,
    )

    op.alter_column(
        "teachers",
        "address",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )