from app.database import SessionLocal
from app import models

db = SessionLocal()
users = db.query(models.User).all()

print(f"Total users in DB: {len(users)}")
for u in users:
    print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | Pwd: {u.hashed_password}")

db.close()
