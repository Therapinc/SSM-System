from pydantic import BaseModel, Field
from typing import List


class TherapistStudentAssignmentsUpdate(BaseModel):
    student_ids: List[int] = Field(default_factory=list)