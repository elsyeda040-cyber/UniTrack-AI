from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, database
from app.database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="UniTrack AI API")

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
