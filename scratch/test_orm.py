
import sys
import os

# Add backend directory to path
sys.path.append(r"d:\Unit Tiack AI\backend")

from app.database import SessionLocal
from app import models

db = SessionLocal()

# Try to find a student who is in team_students
student_id = "std_2202820"
user = db.query(models.User).filter(models.User.id == student_id).first()

if user:
    print(f"User found: {user.name} ({user.role})")
    print(f"Teams as student: {len(user.teams_as_student)}")
    if user.teams_as_student:
        print(f"First team: {user.teams_as_student[0].name}")
    
    # Check Team side
    if user.teams_as_student:
        team = user.teams_as_student[0]
        print(f"Team {team.name} students count: {len(team.students)}")
else:
    print("User not found in DB!")

db.close()
