import psycopg2
import json
import sys
from datetime import datetime, timedelta

def seed_demo_data(target_student_id=None):
    conn = psycopg2.connect(
        dbname="school_management_test",
        user="postgres",
        password="postgresren",
        host="localhost",
        port="5432"
    )
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Determine student
    if target_student_id:
        cur.execute("SELECT id, name FROM students WHERE id = %s;", (target_student_id,))
        row = cur.fetchone()
        if not row:
            print(f"Student with id {target_student_id} not found.")
            conn.close()
            return
        student_id, student_name = row
    else:
        # Check if Demo Student exists or create one
        cur.execute("SELECT id, name FROM students WHERE name = 'Demo Test Student' LIMIT 1;")
        row = cur.fetchone()
        if row:
            student_id, student_name = row
            print(f"Using existing Demo Test Student (ID: {student_id})")
        else:
            cur.execute("""
                INSERT INTO students (student_id, name, roll_no, class_name, division, diagnosis, admission_number, academic_year)
                VALUES ('STU0038', 'Demo Test Student', 'DTS-01', 'Primary 1', 'A', 'Autism Spectrum Disorder with Mild ID', 'ADM-2026-99', '2026-2027')
                RETURNING id, name;
            """)
            student_id, student_name = cur.fetchone()
            print(f"Created new Demo Test Student (ID: {student_id})")

    # 2. Build 6-Month IEP Evaluation Data (June 2026 - Nov 2026)
    iep_months = {
        "June 2026": {
            "selectedMonth": "June",
            "sections": {
                "adlSkills": [
                    {"id": 1, "text": "Requires verbal cues to wash hands and face before meal time"},
                    {"id": 2, "text": "Eating soft finger foods with partial assistance and minor spilling"},
                    {"id": 3, "text": "Indicates need for washroom through basic pictorial symbol prompt"}
                ],
                "academic": [
                    {"id": 1, "text": "Identifies primary colors (red, blue, yellow) with flashcard prompts"},
                    {"id": 2, "text": "Holds chunky pencil with digital-pronate grasp for guided scribbling"}
                ],
                "behaviouralSkills": [
                    {"id": 1, "text": "Maintains seated engagement in 10-minute structured circle activities"},
                    {"id": 2, "text": "Responds positively to teacher redirection when transitioning tasks"}
                ]
            }
        },
        "July 2026": {
            "selectedMonth": "July",
            "sections": {
                "adlSkills": [
                    {"id": 1, "text": "Washes and dries hands independently with visual schedule chart"},
                    {"id": 2, "text": "Drinks water from open cup without choking or spilling"},
                    {"id": 3, "text": "Attempts unbuttoning coat and pulling down elastic shorts for restroom"}
                ],
                "academic": [
                    {"id": 1, "text": "Sorts wooden blocks by shape (circle, square, triangle) independently"},
                    {"id": 2, "text": "Follows 2-step verbal directions during classroom routine"}
                ],
                "behaviouralSkills": [
                    {"id": 1, "text": "Plays alongside peers during sensory play without agitation"},
                    {"id": 2, "text": "Shows emerging patience while waiting for turn in playground queue"}
                ]
            }
        },
        "August 2026": {
            "selectedMonth": "August",
            "sections": {
                "adlSkills": [
                    {"id": 1, "text": "Uses spoon independently to finish oatmeal with minimal assistance"},
                    {"id": 2, "text": "Follows full handwashing hygiene sequence with gentle guidance"}
                ],
                "academic": [
                    {"id": 1, "text": "Matches numbers 1 to 5 with corresponding quantity counters"},
                    {"id": 2, "text": "Traces straight vertical and horizontal lines in sand tray"}
                ],
                "behaviouralSkills": [
                    {"id": 1, "text": "Participates in musical rhythm and clapping songs with enthusiasm"},
                    {"id": 2, "text": "Decreased sensory sensitivity to classroom bell chime"}
                ]
            }
        },
        "September 2026": {
            "selectedMonth": "September",
            "sections": {
                "adlSkills": [
                    {"id": 1, "text": "Transfers food from plate to mouth with improved utensil control"},
                    {"id": 2, "text": "Initiates hand drying using clean paper towel independently"}
                ],
                "academic": [
                    {"id": 1, "text": "Recognizes first letter of own name in tactile letter puzzle"},
                    {"id": 2, "text": "Copies diagonal lines with tripod grip guidance"}
                ],
                "behaviouralSkills": [
                    {"id": 1, "text": "Shares classroom sensory ball with peer during partner play"},
                    {"id": 2, "text": "Demonstrates calm demeanour during fire drill simulation"}
                ]
            }
        },
        "October 2026": {
            "selectedMonth": "October",
            "sections": {
                "adlSkills": [
                    {"id": 1, "text": "Zips jacket zipper once engaged by support educator"},
                    {"id": 2, "text": "Disposes food wrapper into classroom dustbin post-snack independently"}
                ],
                "academic": [
                    {"id": 1, "text": "Completes 6-piece jigsaw puzzle with high focus and self-correction"},
                    {"id": 2, "text": "Identifies familiar classroom objects by expressive pointing"}
                ],
                "behaviouralSkills": [
                    {"id": 1, "text": "Greets teachers with 'good morning' gesture upon arrival"},
                    {"id": 2, "text": "Focus duration increased to 18 minutes in tabletop activities"}
                ]
            }
        },
        "November 2026": {
            "selectedMonth": "November",
            "sections": {
                "adlSkills": [
                    {"id": 1, "text": "Manages complete lunchbox routine including opening lid and napkin usage"},
                    {"id": 2, "text": "Consistently independent in classroom restroom sequence"}
                ],
                "academic": [
                    {"id": 1, "text": "Writes first three letters of name with adapted pencil grip"},
                    {"id": 2, "text": "Sorts objects by size (big, medium, small) with 90% accuracy"}
                ],
                "behaviouralSkills": [
                    {"id": 1, "text": "Exhibits excellent adaptation across school assembly and cultural activities"},
                    {"id": 2, "text": "Demonstrates self-regulation using classroom sensory calm corner"}
                ]
            }
        }
    }

    # 3. Special Education FACP Assessment Checklist
    special_edu_tables = [
        {
            "skill": "grossmotor",
            "title": "Gross Motor Skills Assessment",
            "rows": [
                {"item": "Holds head erect when in sitting position", "1": "A", "2": "A", "3": "A"},
                {"item": "Sits without support for 10 minutes", "1": "A", "2": "A", "3": "A"},
                {"item": "Stands unsupported with stable balance", "1": "A", "2": "A", "3": "A"},
                {"item": "Walks upstairs and downstairs alternating feet", "1": "B", "2": "A", "3": "A"},
                {"item": "Jumps to cross small floor obstacle", "1": "B", "2": "B", "3": "A"},
                {"item": "Rides tricycle with guided steering", "1": "B", "2": "B", "3": "B"}
            ]
        },
        {
            "skill": "finemotor",
            "title": "Fine Motor Skills Assessment",
            "rows": [
                {"item": "Picks up small objects using thumb and forefinger (pincer grasp)", "1": "A", "2": "A", "3": "A"},
                {"item": "Makes stack of 5 wooden blocks without toppling", "1": "A", "2": "A", "3": "A"},
                {"item": "Screws and unscrews jar lid", "1": "B", "2": "A", "3": "A"},
                {"item": "Cuts paper across straight line with safety scissors", "1": "B", "2": "B", "3": "A"}
            ]
        }
    ]

    # 4. IEP Program Records (Term Targets & Milestones)
    iep_program_records = [
        {
            "academicYear": "2026-2027",
            "studentName": student_name,
            "terms": [
                {
                    "termName": "Term 1 (Semester 1)",
                    "headers": ["Speech & Communication", "ADL & Self-Care", "Fine Motor & Writing"],
                    "goals": [
                        {
                            "col_0": "Express wants using 2-word phrase or communication board with 80% accuracy",
                            "col_1": "Complete handwashing & lunchbox opening routine independently",
                            "col_2": "Sustain tripod grip and trace letters A to E within tactile guide lines"
                        },
                        {
                            "col_0": "Follow multi-step classroom verbal commands without repeating prompts",
                            "col_1": "Indicate restroom urgency ahead of time without accidents",
                            "col_2": "Cut geometric shapes using safety scissors along border"
                        }
                    ]
                }
            ]
        }
    ]

    # Update Student row with IEP Data, FACP, and Program Records
    cur.execute("""
        UPDATE students
        SET iep_data = %s,
            special_education_tables = %s,
            iep_program_records = %s
        WHERE id = %s;
    """, (
        json.dumps(iep_months),
        json.dumps(special_edu_tables),
        json.dumps(iep_program_records),
        student_id
    ))

    # 5. Populate Multi-Disciplinary Therapy Reports across the 6-month span
    therapies_data = [
        # June 2026
        ("Speech Therapy", "2026-06-12", "Good", "Limited spontaneous verbalization; relies on crying or tugging.", "Engaged with picture exchange communication system. High responsiveness to oral-motor bubble blowing exercises."),
        ("Physiotherapy", "2026-06-18", "Good", "Mild lower extremity postural hypotonia; prefers sitting to standing.", "Completed balance beam walking with one hand supported. Trampoline bouncing tolerated for 8 mins."),
        ("Occupational Therapy", "2026-06-25", "Moderate", "Tactile defensiveness with clay and wet textures.", "Graduated sensory desensitization using textured brushes and kinetic sand. Pincer grasp emerging on pegs."),
        
        # July 2026
        ("Speech Therapy", "2026-07-10", "Excellent", "Difficulty producing bilabial sounds (/p/, /b/, /m/).", "Vocalized 'ma' and 'ba' with mirror imitation. Sustained eye contact during syllable games for 15 seconds."),
        ("Physiotherapy", "2026-07-22", "Good", "Needs encouragement for alternating feet on stair ramps.", "Ascended 6 steps with handrail independently. Squat-to-stand transitions executed 10 times without fatigue."),
        ("Occupational Therapy", "2026-07-28", "Good", "Immature grasp on crayons; wrist hyperflexion.", "Utilized egg-shaped chalk and vertical easel drawing to stimulate wrist extension. Improved bilateral hand coordination."),

        # August 2026
        ("Speech Therapy", "2026-08-14", "Good", "Short attention span during book sharing sessions.", "Pointed to 6 named animals in picture storybook. Imitated animal sound prompts enthusiastically."),
        ("Physiotherapy", "2026-08-20", "Excellent", "Core trunk stability during dynamic play.", "Maintained balance on gym ball for 3 minutes. Caught and threw light volleyball with both hands."),

        # September 2026
        ("Speech Therapy", "2026-09-11", "Good", "Verbal sequencing of 2-word combinations.", "Combined 'want ball' and 'give water' using PECS cards and vocal approximation."),
        ("Occupational Therapy", "2026-09-24", "Excellent", "Fasteners and buttoning manipulation.", "Threaded large wooden beads onto rigid lace within 2 minutes. Fastened large coat buttons independently."),

        # October 2026
        ("Physiotherapy", "2026-10-15", "Excellent", "Agility and obstacle navigation in gym room.", "Completed slalom cone running without knocking obstacles. Jumped with both feet together landing safely."),
        ("Speech Therapy", "2026-10-22", "Excellent", "Receptive understanding of prepositions (in, on, under).", "Placed toy teddy inside box and under chair following single auditory direction."),

        # November 2026
        ("Speech Therapy", "2026-11-06", "Excellent", "Term evaluation of functional communication.", "Spontaneous verbalizations increased significantly. Conversational turn-taking observed with peer."),
        ("Physiotherapy", "2026-11-12", "Excellent", "Semester gross motor physical conditioning check.", "All bilateral coordination and postural balance milestones achieved with high motor endurance."),
        ("Occupational Therapy", "2026-11-20", "Excellent", "Semester functional dexterity and ADL evaluation.", "Demonstrated complete independence with utensil eating, zipping, and adapted pencil grip control.")
    ]

    # Delete existing therapy reports for this student to avoid duplicates
    cur.execute("DELETE FROM therapy_reports WHERE student_id = %s;", (student_id,))

    for t_type, r_date, prog_lvl, complaint, observation in therapies_data:
        cur.execute("""
            INSERT INTO therapy_reports (
                student_id, therapy_type, report_date, progress_level,
                present_complaints, current_observation, assessment_done,
                goals_achieved, progress_notes, provisional_diagnosis, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, NOW(), NOW()
            );
        """, (
            student_id, t_type, r_date, prog_lvl,
            complaint, observation, "Standardized Clinical Observation & Sensory Profile",
            json.dumps({"sensory_motor": {"notes": observation, "response": prog_lvl}}),
            observation,
            "Developmental Milestone Delay & Sensory Processing Adaptation"
        ))

    conn.close()
    print("=" * 60)
    print(f"SUCCESS! Populated 6 full months of demo data for student '{student_name}' (ID: {student_id})")
    print("- 6 Monthly IEP Evaluations (June, July, August, September, October, November 2026)")
    print("- 15 Multi-Disciplinary Therapy Reports (Speech, Physio, Occupational Therapy)")
    print("- FACP Gross & Fine Motor Checklist Assessment")
    print("- IEP Milestone Targets for Semester 1")
    print("=" * 60)

if __name__ == "__main__":
    sid = int(sys.argv[1]) if len(sys.argv) > 1 else None
    seed_demo_data(sid)
