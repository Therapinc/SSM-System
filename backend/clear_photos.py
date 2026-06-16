"""
Database script to safely clear existing student photo bytes (LargeBinary)
and shrink the table size immediately using VACUUM FULL.
"""
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def clear_student_photos():
    db_url = settings.get_database_url()
    # Mask password for logging
    masked_url = db_url
    if "@" in db_url:
        prefix, suffix = db_url.split("@", 1)
        if ":" in prefix:
            proto_user, _ = prefix.rsplit(":", 1)
            masked_url = f"{proto_user}:***@{suffix}"
    
    print(f"Connecting to database: {masked_url}")
    engine = create_engine(db_url)
    
    try:
        # Step 1: Update the photo column to NULL
        print("\nStep 1: Setting 'photo' column to NULL for all students...")
        with engine.connect() as conn:
            result = conn.execute(text("UPDATE students SET photo = NULL;"))
            conn.commit()
            print(f"  ✓ Successfully set photo to NULL (Rows updated: {result.rowcount})")
            
        # Step 2: Reclaim physical disk space using VACUUM FULL
        print("\nStep 2: Reclaiming physical disk space (VACUUM FULL)...")
        print("  (This might take a moment as Postgres rewrites the table. Please wait...)")
        # VACUUM FULL cannot run inside a transaction block, so we set isolation_level to AUTOCOMMIT
        autocommit_engine = engine.execution_options(isolation_level="AUTOCOMMIT")
        with autocommit_engine.connect() as conn:
            conn.execute(text("VACUUM FULL students;"))
            print("  ✓ Successfully vacuumed 'students' table. Disk space reclaimed.")
            
        print("\n✓ Database clean-up completed successfully! No other student fields were modified.")
        
    except Exception as e:
        print(f"\n❌ Error executing script: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    # Add a simple safety confirmation
    confirm = input("WARNING: This will permanently delete all student photos from the database. All other data will remain untouched. Do you want to continue? (yes/no): ")
    if confirm.strip().lower() == 'yes':
        clear_student_photos()
    else:
        print("Aborted.")
