from sqlalchemy import Column, Integer, String, Date, Float, Boolean, Text, LargeBinary # 👈 Updated
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    dob = Column(Date)
    gender = Column(String)
    religion = Column(String)
    caste = Column(String)
    class_name = Column(String)
    roll_no = Column(String)
    division = Column(String, nullable=True)
    birth_place = Column(String)
    house_name = Column(String)
    street_name = Column(String)
    post_office = Column(String)
    pin_code = Column(String)
    revenue_district = Column(String)
    block_panchayat = Column(String, nullable=True)
    local_body = Column(String, nullable=True)
    taluk = Column(String, nullable=True)
    phone_number = Column(String)
    email = Column(String)
    aadhar_number = Column(String, unique=True, index=True, nullable=True)
    ud_id = Column(String, nullable=True)
    
    # Parent/Guardian Information
    father_name = Column(String)
    father_education = Column(String)
    father_occupation = Column(String)
    mother_name = Column(String)
    mother_education = Column(String)
    mother_occupation = Column(String)
    guardian_name = Column(String)
    guardian_relationship = Column(String)
    guardian_contact = Column(String)
    # Special Needs Information
    disability_type = Column(String, nullable=True) 
    disability_percentage = Column(Float, nullable=True) 


    
    # Academic Information
    academic_year = Column(String)
    admission_number = Column(String)
    admission_date = Column(Date)
    # `class_teacher` removed — teacher assignment is derived from teacher class_assignments (class+division)
    
    # Bank Details
    bank_name = Column(String)
    account_number = Column(String)
    branch = Column(String)
    ifsc_code = Column(String)
    
    # Special Needs Information
    disability_type = Column(String)
    disability_percentage = Column(Float)
    medical_conditions = Column(Text)
    allergies = Column(Text)
    identification_marks = Column(Text, nullable=True)
    
    # Additional Fields
    photo = Column(LargeBinary, nullable=True) # legacy fallback for existing database data
    photo_url = Column(String, nullable=True)
    photo_public_id = Column(String, nullable=True)
    # Documents/Certificates stored as JSONB array: [{name, file_data (base64), upload_date, file_size}]
    documents = Column(JSONB, nullable=True)
    created_at = Column(Date)
    updated_at = Column(Date)

    # Case record stored as JSON for flexible schema
    case_record = Column(JSONB)

    
    category = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)

    # Demographic Data
    father_name = Column(String, nullable=True)
    father_education = Column(String, nullable=True)
    father_occupation = Column(String, nullable=True)
    mother_name = Column(String, nullable=True)
    mother_education = Column(String, nullable=True)
    mother_occupation = Column(String, nullable=True)
    guardian_name = Column(String, nullable=True)
    guardian_occupation = Column(String, nullable=True)
    guardian_relationship = Column(String, nullable=True)
    guardian_contact = Column(String, nullable=True)
    total_family_income = Column(String, nullable=True)
    address_and_phone = Column(String, nullable=True)
    
    # Contact & Medical Information
    informant_name = Column(String, nullable=True)
    informant_relationship = Column(String, nullable=True)
    duration_of_contact = Column(String, nullable=True)
    present_complaints = Column(Text, nullable=True)
    previous_treatments = Column(Text, nullable=True)

    # Family & Birth History
    family_history_mental_illness = Column(Text, nullable=True)
    family_history_mental_retardation = Column(Text, nullable=True)
    family_history_epilepsy = Column(Text, nullable=True)
    prenatal_history = Column(Text, nullable=True)
    natal_history = Column(Text, nullable=True)
    postnatal_history = Column(Text, nullable=True)

    # Development History Milestones
    smiles_at_other = Column(Boolean, default=False)
    head_control = Column(Boolean, default=False)
    sitting = Column(Boolean, default=False)
    responds_to_name = Column(Boolean, default=False)
    babbling = Column(Boolean, default=False)
    first_words = Column(Boolean, default=False)
    standing = Column(Boolean, default=False)
    walking = Column(Boolean, default=False)
    two_word_phrases = Column(Boolean, default=False)
    toilet_control = Column(Boolean, default=False)
    sentences = Column(Boolean, default=False)
    physical_deformity = Column(Boolean, default=False)
    development_history_items = Column(Text, nullable=True)

    # Additional History/Assessments
    school_history = Column(Text, nullable=True)
    occupational_history = Column(Text, nullable=True)
    behaviour_problems = Column(Text, nullable=True)
    psychological_assessment = Column(Text, nullable=True)
    medical_examination = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    management_plan = Column(Text, nullable=True)

    # Activities of Daily Living / Self-help & Adaptive
    eating_habits = Column(Text, nullable=True)
    drinking_habits = Column(Text, nullable=True)
    toilet_habits = Column(Text, nullable=True)
    brushing = Column(Text, nullable=True)
    bathing = Column(Text, nullable=True)
    dressing_removing_wearing = Column(Text, nullable=True)
    dressing_buttoning = Column(Text, nullable=True)
    dressing_footwear = Column(Text, nullable=True)
    dressing_grooming = Column(Text, nullable=True)

    # Motor / Sensory / Communication
    gross_motor = Column(Text, nullable=True)
    fine_motor = Column(Text, nullable=True)
    sensory = Column(Text, nullable=True)
    language_communication = Column(Text, nullable=True)
    social_behaviour = Column(Text, nullable=True)
    mobility_in_neighborhood = Column(Text, nullable=True)

    # Cognitive / Attention / Functional
    attention = Column(Text, nullable=True)
    identification_of_objects = Column(Text, nullable=True)
    use_of_objects = Column(Text, nullable=True)
    following_instruction = Column(Text, nullable=True)
    awareness_of_danger = Column(Text, nullable=True)

    # Concept formation
    concept_color = Column(Text, nullable=True)
    concept_size = Column(Text, nullable=True)
    concept_sex = Column(Text, nullable=True)
    concept_shape = Column(Text, nullable=True)
    concept_number = Column(Text, nullable=True)
    concept_time = Column(Text, nullable=True)
    concept_money = Column(Text, nullable=True)

    # Academic & Prevocational
    academic_reading = Column(Text, nullable=True)
    academic_writing = Column(Text, nullable=True)
    academic_arithmetic = Column(Text, nullable=True)
    prevocational_ability = Column(Text, nullable=True)
    prevocational_interest = Column(Text, nullable=True)
    prevocational_dislike = Column(Text, nullable=True)

    # Behaviours / Observations / Recommendations
    any_peculiar_behaviour = Column(Text, nullable=True)
    any_other = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)

    # Medical & Disability
    disability_type = Column(String, nullable=True) 
    disability_percentage = Column(Float, nullable=True)
    specific_diagnostic = Column(Text, nullable=True)
    medical_conditions = Column(String, nullable=True)
    is_on_regular_drugs = Column(String, nullable=True)
    drug_allergy = Column(String, nullable=True)
    food_allergy = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    # Drug history as a JSONB array of {name, dose}
    drug_history = Column(JSONB, nullable=True)
    # Household composition as a JSONB array of {name, age, education, occupation, health, income}
    household = Column(JSONB, nullable=True)
    # Special Education & IEP columns
    iep_data = Column(JSONB, nullable=True)
    special_education_tables = Column(JSONB, nullable=True)
    iep_program_records = Column(JSONB, nullable=True)

    student_documents = relationship("StudentDocument", back_populates="student", cascade="all, delete-orphan")


from sqlalchemy import ForeignKey, DateTime
from sqlalchemy.sql import func

class StudentDocument(Base):
    __tablename__ = "student_documents"

    id = Column(String, primary_key=True, index=True)  # UUID string
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    document_type = Column(String, nullable=True)
    document_label = Column(String, nullable=True)
    content_type = Column(String, nullable=False, default="application/pdf")
    file_data = Column(Text, nullable=False)  # Stores base64 string
    upload_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    file_size = Column(Integer, nullable=False)

    student = relationship("Student", back_populates="student_documents")