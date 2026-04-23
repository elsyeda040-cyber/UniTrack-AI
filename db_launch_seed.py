import json
import os
from sqlalchemy import create_engine, insert, delete
from sqlalchemy.orm import sessionmaker
import sys

# Add backend to path to import models
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.models import Base, User, Team, team_students
from app.database import SQLALCHEMY_DATABASE_URL

def seed_database():
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    source_path = 'final_seeding.json'
    if not os.path.exists(source_path):
        print(f"Source file {source_path} not found.")
        return

    with open(source_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    try:
        # 1. Clear existing data in specific order (respecting foreign keys)
        print("Cleaning up existing data...")
        db.execute(delete(team_students))
        db.query(Team).delete()
        db.query(User).delete()
        db.commit()

        # 2. Insert Users
        print(f"Inserting {len(data['users'])} users...")
        db.bulk_insert_mappings(User, data['users'])
        db.commit()

        # 3. Insert Teams
        print(f"Inserting {len(data['teams'])} teams...")
        db.bulk_insert_mappings(Team, data['teams'])
        db.commit()

        # 4. Insert Team-Student associations
        print(f"Linking {len(data['team_students'])} students to teams...")
        db.execute(insert(team_students), data['team_students'])
        db.commit()

        print("Database re-populated successfully!")

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
