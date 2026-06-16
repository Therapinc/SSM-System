import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.api import deps
from app.db.base_class import Base
from app.models.user import User, UserRole
from app.models.therapist import Therapist
from app.models.student import Student
from app.models.therapy_report import TherapyReport

# We can run tests using the active test database or a mock session.
# Let's create a script that tests the endpoints using TestClient and mock deps overrides.

client = TestClient(app)

def test_therapist_auth_and_restrictions():
    # 1. We mock the db session and get_current_active_user dependency
    from app.db.session import SessionLocal
    db = SessionLocal()
    
    try:
        # Let's fetch or create a student to test with
        student = db.query(Student).first()
        if not student:
            # Create a mock student if none exist
            student = Student(student_id="TESTSTU123", name="Test Student")
            db.add(student)
            db.commit()
            db.refresh(student)
            
        print(f"Testing with Student: ID={student.id}, Name={student.name}")
        
        # Ensure our test therapists exist in the database
        # Therapist 1: Speech Therapy
        t_speech = db.query(Therapist).filter(Therapist.email == "test_speech@example.com").first()
        if not t_speech:
            t_speech = Therapist(name="Speech Therapist", email="test_speech@example.com", specialization="Speech Therapy", aadhar_number="123456789012")
            db.add(t_speech)
        else:
            t_speech.specialization = "Speech Therapy"
            
        # Therapist 2: Physiotherapy
        t_physio = db.query(Therapist).filter(Therapist.email == "test_physio@example.com").first()
        if not t_physio:
            t_physio = Therapist(name="Physio Therapist", email="test_physio@example.com", specialization="Physiotherapy", aadhar_number="123456789013")
            db.add(t_physio)
        else:
            t_physio.specialization = "Physiotherapy"
            
        # User accounts for them
        u_speech = db.query(User).filter(User.email == "test_speech@example.com").first()
        if not u_speech:
            u_speech = User(username="speech_therapist", email="test_speech@example.com", hashed_password="mock", role=UserRole.THERAPIST)
            db.add(u_speech)
            
        u_physio = db.query(User).filter(User.email == "test_physio@example.com").first()
        if not u_physio:
            u_physio = User(username="physio_therapist", email="test_physio@example.com", hashed_password="mock", role=UserRole.THERAPIST)
            db.add(u_physio)
            
        # Admin User
        u_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not u_admin:
            u_admin = User(username="test_admin", email="test_admin@example.com", hashed_password="mock", role=UserRole.ADMIN)
            db.add(u_admin)
            
        db.commit()
        db.refresh(u_speech)
        db.refresh(u_physio)
        db.refresh(u_admin)
        
        # Overrides for FastAPI dependency injection
        # Helper to override current_user
        current_test_user = None
        
        def override_get_current_active_user():
            return current_test_user
            
        app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user
        
        # --- TEST 1: Creation Restriction ---
        print("\n--- Running Test 1: Entry Restrictions ---")
        
        # Speech therapist tries to enter Physiotherapy report -> Should fail (403)
        current_test_user = u_speech
        payload = {
            "student_id": student.id,
            "therapy_type": "Physiotherapy",
            "report_date": "2026-06-16",
            "progress_notes": "Trying to write a physio report",
            "goals_achieved": {},
            "challenges": "None",
            "recommendations": "None",
            "next_goals": "None",
            "progress_level": "Excellent"
        }
        
        response = client.post("/api/v1/therapy-reports/", json=payload)
        print(f"Speech Therapist entering Physiotherapy report: Status {response.status_code}")
        assert response.status_code == 403, "Should fail with 403 Forbidden"
        print("✅ Correctly rejected report creation under invalid specialization!")
        
        # Speech therapist tries to enter Speech Therapy report -> Should succeed (200)
        payload["therapy_type"] = "Speech Therapy"
        response = client.post("/api/v1/therapy-reports/", json=payload)
        print(f"Speech Therapist entering Speech Therapy report: Status {response.status_code}")
        assert response.status_code == 200, "Should succeed with 200"
        speech_report_id = response.json()["id"]
        print(f"✅ Correctly allowed report creation under specialization! (Report ID: {speech_report_id})")
        
        # Physio therapist tries to enter Physiotherapy report -> Should succeed (200)
        current_test_user = u_physio
        payload["therapy_type"] = "Physiotherapy"
        response = client.post("/api/v1/therapy-reports/", json=payload)
        print(f"Physio Therapist entering Physiotherapy report: Status {response.status_code}")
        assert response.status_code == 200, "Should succeed with 200"
        physio_report_id = response.json()["id"]
        print(f"✅ Correctly allowed report creation under specialization! (Report ID: {physio_report_id})")
        
        # --- TEST 2: View Restriction / Filtering ---
        print("\n--- Running Test 2: View Restrictions ---")
        
        # Speech therapist lists reports for student -> Should only see Speech Therapy
        current_test_user = u_speech
        response = client.get(f"/api/v1/therapy-reports/student/{student.id}")
        print(f"Speech Therapist view status: {response.status_code}")
        assert response.status_code == 200
        reports_viewed = response.json()
        types_viewed = set(r["therapy_type"] for r in reports_viewed)
        print(f"Speech Therapist saw reports of type(s): {types_viewed}")
        assert "Physiotherapy" not in types_viewed, "Should not see Physiotherapy reports"
        print("✅ Correctly filtered reports lists to only display specialization!")
        
        # Physio therapist lists reports for student -> Should only see Physiotherapy
        current_test_user = u_physio
        response = client.get(f"/api/v1/therapy-reports/student/{student.id}")
        print(f"Physio Therapist view status: {response.status_code}")
        assert response.status_code == 200
        reports_viewed = response.json()
        types_viewed = set(r["therapy_type"] for r in reports_viewed)
        print(f"Physio Therapist saw reports of type(s): {types_viewed}")
        assert "Speech Therapy" not in types_viewed, "Should not see Speech Therapy reports"
        print("✅ Correctly filtered reports lists to only display specialization!")
        
        # Admin lists reports for student -> Should see all reports
        current_test_user = u_admin
        response = client.get(f"/api/v1/therapy-reports/student/{student.id}")
        print(f"Admin view status: {response.status_code}")
        assert response.status_code == 200
        reports_viewed = response.json()
        types_viewed = set(r["therapy_type"] for r in reports_viewed)
        print(f"Admin saw reports of type(s): {types_viewed}")
        assert len(types_viewed) >= 2, "Admin should see both Speech Therapy and Physiotherapy reports"
        print("✅ Admin has full access as expected!")
        
        # --- TEST 3: Therapist Name population ---
        print("\n--- Running Test 3: Therapist Name Population ---")
        
        # Check if the returned report has therapist_name set correctly
        current_test_user = u_admin
        response = client.get(f"/api/v1/therapy-reports/student/{student.id}")
        reports = response.json()
        
        speech_report_from_api = next(r for r in reports if r["id"] == speech_report_id)
        print(f"Speech Therapist report: therapist_name='{speech_report_from_api.get('therapist_name')}'")
        assert speech_report_from_api.get("therapist_name") == "Speech Therapist", "Name should be populated as Speech Therapist"
        
        physio_report_from_api = next(r for r in reports if r["id"] == physio_report_id)
        print(f"Physio Therapist report: therapist_name='{physio_report_from_api.get('therapist_name')}'")
        assert physio_report_from_api.get("therapist_name") == "Physio Therapist", "Name should be populated as Physio Therapist"
        
        print("✅ Therapist names are successfully populated on reports instead of 'N/A'!")
        
        # Clean up created reports to keep database clean
        db.execute(text(f"DELETE FROM therapy_reports WHERE id IN ({speech_report_id}, {physio_report_id})"))
        db.commit()
        print("\nCleaned up test reports.")
        
    finally:
        app.dependency_overrides.clear()
        db.close()

if __name__ == "__main__":
    test_therapist_auth_and_restrictions()
