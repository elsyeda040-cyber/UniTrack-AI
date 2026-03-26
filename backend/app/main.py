from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
import google.generativeai as genai
from dotenv import load_dotenv

from app import models, schemas, database
from app.database import engine, get_db

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="UniTrack AI API")

# Setup AI route
@app.post("/ai/chat")
async def ai_chat(prompt: schemas.AIPrompt):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")
    try:
        model = genai.GenerativeModel('gemini-pro')
        full_prompt = f"System Context: {prompt.context}\nUser Instruction: {prompt.message}" if prompt.context else prompt.message
        response = model.generate_content(full_prompt)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Auto-seed database on startup (needed for Railway where SQLite resets on redeploy)
@app.on_event("startup")
async def startup_seed():
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        # Only seed if no users exist
        if db.query(models.User).count() == 0:
            print("Database is empty. Seeding initial data...")
            _seed_database(db)
            print("Database seeded successfully!")
        else:
            print(f"Database already has {db.query(models.User).count()} users. Skipping seed.")
        db.close()
    except Exception as e:
        print(f"Seeding error (non-fatal): {e}")

def _seed_database(db):
    import datetime
    users = [
        models.User(id='stu-001', name='Ahmed Mohamed', email='ahmed@university.edu', role='student', bio='Academic enthusiast.'),
        models.User(id='stu-002', name='Hossam Dagaks', email='hossam@university.edu', role='student'),
        models.User(id='stu-003', name='Mona Ali', email='mona@university.edu', role='student'),
        models.User(id='stu-004', name='Ziad Youssef', email='ziad@university.edu', role='student'),
        models.User(id='prof-001', name='Dr. Hassan Ibrahim', email='hassan@university.edu', role='professor'),
        models.User(id='prof-002', name='Dr. Nadia Selim', email='nadia@university.edu', role='professor'),
        models.User(id='ta-001', name='Eng. Sara Khaled', email='sara@university.edu', role='assistant'),
        models.User(id='ta-002', name='Eng. Omar Tarek', email='omar@university.edu', role='assistant'),
        models.User(id='admin-001', name='Administration', email='admin@university.edu', role='admin'),
    ]
    for u in users:
        db.add(u)
    db.commit()

    teams = [
        models.Team(id='team-001', name='Team Alpha', project_title='AI-Powered Library System', progress=68, color='#3b82f6', emoji='🚀', professor_id='prof-001', assistant_id='ta-001'),
        models.Team(id='team-002', name='Team Beta', project_title='E-Learning Platform', progress=45, color='#8b5cf6', emoji='📚', professor_id='prof-001', assistant_id='ta-001'),
        models.Team(id='team-003', name='Team Gamma', project_title='Smart City IoT', progress=30, color='#10b981', emoji='🏙️', professor_id='prof-002', assistant_id='ta-002'),
    ]
    for t in teams:
        db.add(t)
    db.commit()

    # Link students to teams
    team1 = db.query(models.Team).filter(models.Team.id == 'team-001').first()
    team3 = db.query(models.Team).filter(models.Team.id == 'team-003').first()
    stu1 = db.query(models.User).filter(models.User.id == 'stu-001').first()
    stu2 = db.query(models.User).filter(models.User.id == 'stu-002').first()
    stu3 = db.query(models.User).filter(models.User.id == 'stu-003').first()
    stu4 = db.query(models.User).filter(models.User.id == 'stu-004').first()
    if team1 and stu1: team1.students.append(stu1)
    if team1 and stu2: team1.students.append(stu2)
    if team3 and stu3: team3.students.append(stu3)
    if team3 and stu4: team3.students.append(stu4)
    db.commit()

    tasks = [
        models.Task(id='task-001', team_id='team-001', title='Research & Analysis', description='Study existing systems.', deadline='2026-03-20', status='completed', files_required=True, score=90, feedback='Excellent!', color='#10b981'),
        models.Task(id='task-002', team_id='team-001', title='System Design', description='Design schema.', deadline='2026-03-28', status='completed', files_required=True, score=85, feedback='Good.', color='#10b981'),
        models.Task(id='task-003', team_id='team-001', title='UI/UX Prototype', description='Build prototype.', deadline='2026-04-05', status='in_progress', files_required=True, color='#f59e0b'),
        models.Task(id='task-004', team_id='team-003', title='Requirements Gathering', description='Talk to stakeholders.', deadline='2026-03-25', status='completed', files_required=True, score=88, color='#10b981'),
    ]
    for tk in tasks:
        db.add(tk)

    notifications = [
        models.Notification(user_id='stu-001', type='feedback', title='New Feedback', message='Dr. Hassan left feedback.', time='5 min ago', read=False),
        models.Notification(user_id='stu-001', type='deadline', title='Deadline Approaching', message='UI prototype due in 3 days.', time='1 hr ago', read=False),
    ]
    for n in notifications:
        db.add(n)
    db.commit()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://unit-track-ai.vercel.app",
        "https://unit-tiack-ai.vercel.app",   # اسم بديل محتمل
        "https://*.vercel.app",               # Vercel preview deployments
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "UniTrack AI API is running"}

# Auth Endpoint (Simplified)
@app.post("/auth/login", response_model=schemas.UserResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get teamId for student
    team_id = None
    if user.role == 'student' and user.teams_as_student:
        team_id = user.teams_as_student[0].id
    
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar,
        "bio": user.bio,
        "teamId": team_id
    }
    return user_dict

# User Endpoints
@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    team_id = None
    if user.role == 'student' and user.teams_as_student:
        team_id = user.teams_as_student[0].id

    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar,
        "bio": user.bio,
        "teamId": team_id
    }
    return user_dict

# Task Endpoints
@app.get("/teams/{team_id}/tasks", response_model=List[schemas.TaskResponse])
def get_team_tasks(team_id: str, db: Session = Depends(get_db)):
    return db.query(models.Task).filter(models.Task.team_id == team_id).all()

@app.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: str, task_data: schemas.TaskBase, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task_data.dict(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task

# Notification Endpoints
@app.get("/users/{user_id}/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).all()

# Chat Endpoints
@app.get("/teams/{team_id}/messages", response_model=List[schemas.MessageResponse])
def get_messages(team_id: str, db: Session = Depends(get_db)):
    return db.query(models.Message).filter(models.Message.team_id == team_id).all()

@app.post("/teams/{team_id}/messages", response_model=schemas.MessageResponse)
def create_message(team_id: str, msg: schemas.MessageBase, db: Session = Depends(get_db)):
    new_msg = models.Message(**msg.dict())
    new_msg.team_id = team_id
    new_msg.is_own = True # Normally determined by session, defaulting for demo
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

# Team Endpoints
@app.get("/teams", response_model=List[schemas.TeamResponse])
def get_all_teams(db: Session = Depends(get_db)):
    return db.query(models.Team).all()

@app.get("/professors/{prof_id}/teams", response_model=List[schemas.TeamResponse])
def get_professor_teams(prof_id: str, db: Session = Depends(get_db)):
    return db.query(models.Team).filter(models.Team.professor_id == prof_id).all()

@app.get("/assistants/{assistant_id}/teams", response_model=List[schemas.TeamResponse])
def get_assistant_teams(assistant_id: str, db: Session = Depends(get_db)):
    return db.query(models.Team).filter(models.Team.assistant_id == assistant_id).all()

# Admin Endpoints
@app.get("/admin/stats", response_model=schemas.AdminStats)
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_teams = db.query(models.Team).count()
    total_tasks = db.query(models.Task).count()
    avg_progress = db.query(models.Team.progress).all()
    avg = sum([p[0] for p in avg_progress]) / len(avg_progress) if avg_progress else 0
    return {
        "total_users": total_users,
        "total_teams": total_teams,
        "total_tasks": total_tasks,
        "avg_progress": avg
    }

@app.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    result = []
    for user in users:
        team_id = user.teams_as_student[0].id if user.role == 'student' and user.teams_as_student else None
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar": user.avatar,
            "bio": user.bio,
            "teamId": team_id
        })
    return result
