import sys
import os
from datetime import datetime

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.student import Student, StudentDocument

def migrate_documents():
    db = SessionLocal()
    print("🚀 Starting data migration: students.documents JSON -> student_documents table")
    print("=" * 80)
    
    try:
        students = db.query(Student).all()
        migrated_docs_count = 0
        students_affected_count = 0
        
        for student in students:
            if not student.documents:
                continue
                
            print(f"📄 Found documents for Student ID {student.id} ({student.name})")
            
            # documents is a list of dicts: [{id, name, documentType, documentLabel, content_type, file_data, upload_date, file_size}]
            docs_list = student.documents
            if not isinstance(docs_list, list):
                print(f"  ⚠️ Student documents is not a list (type: {type(docs_list)}). Skipping...")
                continue
                
            student_migrated_count = 0
            for doc_dict in docs_list:
                doc_id = doc_dict.get("id")
                if not doc_id:
                    print("  ⚠️ Document missing ID. Skipping...")
                    continue
                    
                # Check if already migrated
                existing = db.query(StudentDocument).filter(StudentDocument.id == doc_id).first()
                if existing:
                    print(f"  ℹ️ Document {doc_id} ('{doc_dict.get('name')}') already exists in student_documents. Skipping insert...")
                    student_migrated_count += 1
                    continue
                
                # Parse upload date
                upload_date_str = doc_dict.get("upload_date")
                upload_date = datetime.now()
                if upload_date_str:
                    try:
                        upload_date = datetime.fromisoformat(upload_date_str)
                    except Exception:
                        pass
                
                # Insert document
                new_doc = StudentDocument(
                    id=doc_id,
                    student_id=student.id,
                    name=doc_dict.get("name") or "document",
                    document_type=doc_dict.get("documentType"),
                    document_label=doc_dict.get("documentLabel"),
                    content_type=doc_dict.get("content_type") or "application/pdf",
                    file_data=doc_dict.get("file_data") or "",
                    upload_date=upload_date,
                    file_size=doc_dict.get("file_size") or 0
                )
                db.add(new_doc)
                migrated_docs_count += 1
                student_migrated_count += 1
                print(f"  ✅ Migrated: '{new_doc.name}' (ID: {doc_id}, Size: {new_doc.file_size} bytes)")
            
            # Clear the documents JSON list on student once all files are successfully processed
            if student_migrated_count == len(docs_list):
                student.documents = None
                students_affected_count += 1
                print(f"  🧹 Cleared JSON 'documents' column for Student {student.id} to release database size.")
            else:
                print(f"  ❌ Not all documents for student {student.id} could be migrated. Keeping JSON 'documents' column to prevent data loss.")
                
            print("-" * 80)
            
        if migrated_docs_count > 0 or students_affected_count > 0:
            db.commit()
            print(f"🎉 Successfully migrated {migrated_docs_count} documents across {students_affected_count} students!")
        else:
            print("ℹ️ No documents needed migration.")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error during migration: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    migrate_documents()
