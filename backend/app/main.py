from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
import logging
from datetime import datetime
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
        from datetime import datetime, timedelta
        # Railway runs on UTC. Convert to Cairo time (UTC+2)
        cairo_time = datetime.utcnow() + timedelta(hours=2)
        now = cairo_time.strftime("%Y-%m-%d %I:%M %p")
        
        base_instruction = prompt.context if prompt.context else "You are a helpful AI assistant."
        instruction_with_time = f"{base_instruction}\n\n[معلومة نظامية: الوقت والتاريخ الحالي بتوقيت مصر (القاهرة) هو {now}]. إذا سألك المستخدم عن الوقت، أجب بدقة بناءً على هذا التوقيت فقط."

        model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            system_instruction=instruction_with_time
        )
        response = model.generate_content(prompt.message)
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
    messages = db.query(models.Message).filter(models.Message.team_id == team_id).all()
    result = []
    for msg in messages:
        user = db.query(models.User).filter(models.User.id == msg.sender_id).first()
        result.append({
            "id": msg.id,
            "team_id": msg.team_id,
            "sender_id": msg.sender_id,
            "text": msg.text,
            "type": msg.type,
            "url": msg.url,
            "file_name": msg.file_name,
            "file_size": msg.file_size,
            "duration": msg.duration,
            "time": msg.time.isoformat() + "Z",
            "is_own": msg.is_own,
            "sender": user.name if user else "Member",
            "role": user.role if user else "student"
        })
    return result

@app.post("/teams/{team_id}/chat-summary")
def get_chat_summary(team_id: str, db: Session = Depends(get_db)):
    try:
        # Fetch last 50 messages
        messages = db.query(models.Message).filter(models.Message.team_id == team_id).order_by(models.Message.time.desc()).limit(50).all()
        if not messages:
            return {"summary": "لا توجد رسائل كافية للتلخيص حالياً."}
        
        # Format messages for AI
        chat_history = ""
        for msg in reversed(messages):
            sender = db.query(models.User).filter(models.User.id == msg.sender_id).first()
            name = sender.name if sender else "Member"
            text = msg.text if msg.type == 'text' else "[Media/File]"
            chat_history += f"{name}: {text}\n"
        
        # Call Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        أنت مساعد ذكي لمشروعات التخرج. 
        بناءً على المحادثة التالية بين أعضاء الفريق، قم بكتابة ملخص موجز جداً (باللغة العربية) 
        يوضح أهم ما تم مناقشته، القرارات التي تم اتخاذها، والمهام المتبقية إن وجدت.
        اجعل الملخص في شكل نقاط بسيطة وسهلة القراءة.
        
        المحادثة:
        {chat_history}
        """
        
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        print(f"AI_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="فشل في توليد الملخص بالذكاء الاصطناعي")

@app.post("/teams/{team_id}/messages", response_model=schemas.MessageResponse)
def create_message(team_id: str, msg: schemas.MessageBase, db: Session = Depends(get_db)):
    try:
        new_msg = models.Message(**msg.dict())
        new_msg.team_id = team_id
        new_msg.is_own = True 
        db.add(new_msg)
        
        # Robust notification logic
        # 1. Find the team (try exact match then case-insensitive)
        team = db.query(models.Team).filter(models.Team.id == team_id).first()
        if not team:
             team = db.query(models.Team).filter(models.Team.id.ilike(team_id)).first()
        
        if team:
            # 2. Collect ALL potential member IDs
            recipient_ids = []
            
            # Query the association table directly for students
            student_links = db.query(models.team_students).filter(models.team_students.c.team_id == team.id).all()
            for link in student_links:
                recipient_ids.append(link.student_id)
            
            if team.professor_id: recipient_ids.append(team.professor_id)
            if team.assistant_id: recipient_ids.append(team.assistant_id)
            
            # 3. Filter: unique, not the sender (case-insensitive)
            sender_id_lower = str(msg.sender_id).lower()
            final_recipients = set([r for r in recipient_ids if str(r).lower() != sender_id_lower])
            
            sender = db.query(models.User).filter(models.User.id == msg.sender_id).first()
            sender_display_name = sender.name if sender else "Member"
            text_preview = (msg.text[:50] + "...") if msg.text and len(msg.text) > 50 else (msg.text or "Sent a file")
            
            for r_id in final_recipients:
                notif = models.Notification(
                    user_id=r_id,
                    type="chat",
                    title=f"Chat: {sender_display_name}",
                    message=text_preview,
                    time=datetime.now().isoformat(),
                    read=False
                )
                db.add(notif)
                print(f"DEBUG: Notifying {r_id} about message from {sender_id_lower}")

        db.commit()
        db.refresh(new_msg)
        return new_msg
    except Exception as e:
        db.rollback()
        print(f"CHAT_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/{user_id}/notifications/clear-chat")
def clear_chat_notifications(user_id: str, db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.type == "chat"
    ).update({"read": True})
    db.commit()
    return {"status": "success"}

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

@app.post("/admin/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    import uuid
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = user.id if user.id else f"{user.role[:3]}-{str(uuid.uuid4())[:6]}"

    new_user = models.User(
        id=user_id,
        name=user.name,
        email=user.email,
        role=user.role,
        avatar=user.avatar,
        bio=user.bio,
        hashed_password=user.password
    )
    db.add(new_user)
    
    if user.role == 'student' and user.team_id:
        team = db.query(models.Team).filter(models.Team.id == user.team_id).first()
        if team:
            team.students.append(new_user)
            
    db.commit()
    db.refresh(new_user)
    
    team_id_res = user.team_id if user.role == 'student' else None
    
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "avatar": new_user.avatar,
        "bio": new_user.bio,
        "teamId": team_id_res
    }

@app.post("/admin/teams", response_model=schemas.TeamResponse)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    import uuid
    team_id = f"T-{str(uuid.uuid4())[:6].upper()}"
    new_team = models.Team(
        id=team_id,
        name=team.name,
        project_title=team.project_title,
        color=team.color,
        emoji=team.emoji,
        progress=0
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team

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

@app.put("/admin/users/{user_id}/team", response_model=schemas.UserResponse)
def update_user_team(user_id: str, data: schemas.UserUpdateTeam, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clear current team
    if user.role == 'student':
        user.teams_as_student = []
    elif user.role == 'professor':
        prof_teams = db.query(models.Team).filter(models.Team.professor_id == user_id).all()
        for t in prof_teams:
            t.professor_id = None
            
    # Assign new team
    if data.team_id:
        team = db.query(models.Team).filter(models.Team.id == data.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        if user.role == 'student':
            team.students.append(user)
        elif user.role == 'professor':
            team.professor_id = user.id
            
    db.commit()
    db.refresh(user)
    
    # Return formatted response
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar,
        "bio": user.bio,
        "teamId": data.team_id
    }
