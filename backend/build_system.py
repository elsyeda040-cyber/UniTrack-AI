import json
import os
import sys
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Path to seeding JSON
json_path = os.path.join(os.path.dirname(os.getcwd()), 'projects_seeding.json')

def build_db():
    if not os.path.exists(json_path):
        print(f"❌ Error: {json_path} not found!")
        return

    print("🛠 Initializing Database with Official Schema...")
    # This creates all tables defined in models.py
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print(f"🚀 Seeding {len(data)} projects into the system...")

        for p_data in data:
            p_id = str(p_data['project_id'])
            
            # 1. Create/Get Professor
            prof_data = p_data['doctor']
            
            # Check if prof already exists by email
            professor = db.query(models.User).filter(models.User.email == prof_data['email']).first()
            if not professor:
                prof_id = f"doc_{p_id}"
                professor = models.User(
                    id=prof_id,
                    name=prof_data['name'],
                    email=prof_data['email'],
                    role="professor",
                    hashed_password="password"
                )
                db.add(professor)
                db.flush()
            
            prof_id = professor.id

            # 2. Create Team
            team = db.query(models.Team).filter(models.Team.id == p_id).first()
            if not team:
                team = models.Team(
                    id=p_id,
                    name=f"Team {p_id}",
                    project_title=p_data['title'],
                    professor_id=prof_id,
                    color="#3b82f6",
                    emoji="🚀"
                )
                db.add(team)
                db.flush()

            # 3. Create Students and Link to Team
            for s_data in p_data['students']:
                s_id = s_data['code']
                student = db.query(models.User).filter(models.User.id == s_id).first()
                if not student:
                    student = models.User(
                        id=s_id,
                        name=s_data['name'],
                        email=s_data['email'],
                        role="student",
                        hashed_password="password"
                    )
                    db.add(student)
                    db.flush()
                
                # Link student to team if not already linked
                if student not in team.students:
                    team.students.append(student)

        db.commit()
        print(f"✅ SUCCESS! Database built and seeded with {len(data)} projects.")
        
        # Add a default admin if not exists
        admin = db.query(models.User).filter(models.User.role == "admin").first()
        if not admin:
            print("👤 Adding default Admin account...")
            admin = models.User(
                id="admin-dhic",
                name="System Admin",
                email="admin@dhic.edu.eg",
                role="admin",
                hashed_password="admin88"
            )
            db.add(admin)
            db.commit()
            print("✅ Admin created: admin@dhic.edu.eg / admin88")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during build: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    build_db()
