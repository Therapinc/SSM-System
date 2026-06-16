"""
Migration script to add iep_data, special_education_tables, and iep_program_records columns to students table.
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate_database():
    db_url = settings.get_database_url()
    print(f"Connecting to database: {db_url.split('@')[-1]}")
    engine = create_engine(db_url)
    
    with engine.begin() as conn:
        print("Checking existing columns in 'students' table...")
        
        # Check existing columns
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'students'
        """))
        existing_columns = {row[0] for row in result.fetchall()}
        
        columns_to_add = {
            "iep_data": "ALTER TABLE students ADD COLUMN iep_data JSONB DEFAULT NULL",
            "special_education_tables": "ALTER TABLE students ADD COLUMN special_education_tables JSONB DEFAULT NULL",
            "iep_program_records": "ALTER TABLE students ADD COLUMN iep_program_records JSONB DEFAULT NULL"
        }
        
        for col_name, sql_stmt in columns_to_add.items():
            if col_name in existing_columns:
                print(f"  - Column '{col_name}' already exists.")
            else:
                print(f"  - Adding column '{col_name}'...")
                conn.execute(text(sql_stmt))
                print(f"    [OK] Column '{col_name}' added successfully.")
                
    print("\n[OK] Database migration completed successfully!")

if __name__ == "__main__":
    migrate_database()
