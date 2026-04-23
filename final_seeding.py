import json
import os
import sys
from sqlalchemy import create_engine, insert, delete
from sqlalchemy.orm import sessionmaker

# 1. Configuration & Path Setup
ROOT_DIR = os.getcwd()
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
# Ensure backend/app is in path for imports
sys.path.append(BACKEND_DIR)

try:
    from app.models import Base, User, Team, team_students
    # We define the DB path explicitly to avoid relative path issues
    DB_PATH = os.path.join(BACKEND_DIR, 'unitrack.db')
    DATABASE_URL = f"sqlite:///{DB_PATH}"
except ImportError:
    print("Error: Could not import backend models. Make sure you are running from the project root.")
    sys.exit(1)

def generate_and_seed():
    source_path = os.path.join(ROOT_DIR, 'projects_seeding.json')
    if not os.path.exists(source_path):
        print(f"Source file {source_path} not found in {ROOT_DIR}")
        return

    print(f"Reading source data from {source_path}...")
    with open(source_path, 'r', encoding='utf-8') as f:
        projects = json.load(f)

    users_data = []
    teams_data = []
    team_students_data = []
    user_map = {} # email -> user_id

    # Add Admin
    admin_email = "admin@unitrack.edu"
    admin_id = "admin_001"
    users_data.append({
        "id": admin_id,
        "name": "Admin User",
        "email": admin_email,
        "role": "admin",
        "hashed_password": "password"
    })
    user_map[admin_email] = admin_id

    team_id_counter = 1

    print("Processing data structures...")
    for proj in projects:
        doctor = proj.get('doctor')
        if not doctor: continue
        
        doc_email = doctor['email'].lower()
        if doc_email.endswith('.ed'): doc_email = doc_email[:-3] + '.edu'
        elif not doc_email.endswith('.edu'): doc_email = doc_email.split('@')[0] + '@unitrack.edu'
        if doc_email not in user_map:
            # Extract first name for ID or use a counter
            doc_id = f"prof_{len(user_map) + 1}"
            users_data.append({
                "id": doc_id,
                "name": doctor['name'],
                "email": doc_email,
                "role": "professor",
                "hashed_password": "password"
            })
            user_map[doc_email] = doc_id
        
        prof_id = user_map[doc_email]

        t_id = f"team_{team_id_counter:03d}"
        teams_data.append({
            "id": t_id,
            "name": f"Team {proj['project_id']}",
            "project_title": proj['title'],
            "progress": 0,
            "color": "#3b82f6",
            "emoji": "🚀",
            "professor_id": prof_id,
            "assistant_id": None
        })
        team_id_counter += 1

        students = proj.get('students', [])
        for std in students:
            if std.get('role') != 'student': continue
            
            std_email = std['email'].lower()
            if std_email.endswith('.ed'): std_email = std_email[:-3] + '.edu'
            elif not std_email.endswith('.edu'): std_email = std_email.split('@')[0] + '@unitrack.edu'
            if std_email not in user_map:
                std_id = f"std_{std['code']}"
                users_data.append({
                    "id": std_id,
                    "name": std['name'],
                    "email": std_email,
                    "role": "student",
                    "hashed_password": "password"
                })
                user_map[std_email] = std_id
            
            current_std_id = user_map[std_email]
            team_students_data.append({
                "team_id": t_id,
                "student_id": current_std_id
            })

    output_data = {
        "users": users_data,
        "teams": teams_data,
        "team_students": team_students_data
    }

    # Save to JSON file as requested
    output_json_path = os.path.join(ROOT_DIR, 'final_seeding.json')
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)
    print(f"Saved structured data to {output_json_path}")

    # Database Operation
    print(f"Connecting to database at {DB_PATH}...")
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("Cleaning up tables: team_students, teams, users...")
        db.execute(delete(team_students))
        db.query(Team).delete()
        db.query(User).delete()
        db.commit()

        print(f"Seeding {len(users_data)} users...")
        db.bulk_insert_mappings(User, users_data)
        
        print(f"Seeding {len(teams_data)} teams...")
        db.bulk_insert_mappings(Team, teams_data)
        
        print(f"Seeding {len(team_students_data)} team-student links...")
        db.execute(insert(team_students), team_students_data)
        
        db.commit()
        print("\nSUCCESS: Database fully synced and seeded!")
        print(f"Professors: {len([u for u in users_data if u['role']=='professor'])}")
        print(f"Students: {len([u for u in users_data if u['role']=='student'])}")
        print(f"Teams: {len(teams_data)}")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    generate_and_seed()
