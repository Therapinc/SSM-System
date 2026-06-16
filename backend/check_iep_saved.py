"""
Check if any student records have saved IEP/Special Ed tables in the database.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def check_db():
    db_url = settings.get_database_url()
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, student_id, name, iep_data, special_education_tables, iep_program_records 
            FROM students
        """))
        students = result.fetchall()
        
        print("[INFO] Checking Student database columns...")
        print("=" * 80)
        found = False
        for s in students:
            id_val, stu_id, name, iep, spec, prog = s
            iep_status = "NULL" if iep is None else f"Saved ({len(str(iep))} chars)"
            spec_status = "NULL" if spec is None else f"Saved ({len(str(spec))} chars)"
            prog_status = "NULL" if prog is None else f"Saved ({len(str(prog))} chars)"
            
            if iep is not None or spec is not None or prog is not None:
                print(f"Student: {name} ({stu_id})")
                print(f"  - iep_data: {iep_status}")
                print(f"  - special_education_tables: {spec_status}")
                print(f"  - iep_program_records: {prog_status}")
                print("-" * 80)
                found = True
        
        if not found:
            print("No students have IEP, Special Ed, or IEP Program data saved in the DB yet.")
            print(f"Total students in DB: {len(students)}")
            
if __name__ == "__main__":
    check_db()
