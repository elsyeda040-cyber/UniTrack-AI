from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import logging
import random
import uuid
from datetime import datetime, timedelta
import json
import io
import csv

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("Warning: google-generativeai not installed. AI features will be disabled.")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Environment variables must be set manually.")
    def load_dotenv(): pass

from fastapi.responses import StreamingResponse, Response

try:
    from fpdf import FPDF
except ImportError:
    FPDF = None
    print("Warning: fpdf2 not installed. PDF export will be disabled.")

try:
    from icalendar import Calendar, Event as IcalEvent
except ImportError:
    Calendar = None
    IcalEvent = None
    print("Warning: icalendar not installed. Calendar sync will be disabled.")

from app import models, schemas, database, email_service
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
    if not genai:
        raise HTTPException(status_code=503, detail="AI Service is currently unavailable (module not installed)")
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
    # Initial User Roles for System Audit
    users = [
        models.User(id='admin-001', name='System Admin', email='admin@university.edu', role='admin'),
        models.User(id='prof-001', name='Dr. Ahmed Khalil', email='professor@university.edu', role='professor'),
        models.User(id='stud-001', name='Mohamed Al-Abbasi', email='student@university.edu', role='student'),
        models.User(id='asst-001', name='Sarah Hassan', email='assistant@university.edu', role='assistant'),
    ]
    
    # Create the core UniTrack AI Team
    team = models.Team(
        id='T-TEST-001', 
        name='UniTrack AI Team', 
        project_title='Graduation Monitoring System', 
        progress=45, 
        color='#1e40af', 
        professor_id='prof-001', 
        assistant_id='asst-001'
    )
    
    for u in users:
        db.add(u)
    db.add(team)
    db.commit()
    
    # Link student to the test team
    student = db.query(models.User).filter(models.User.id == 'stud-001').first()
    target_team = db.query(models.Team).filter(models.Team.id == 'T-TEST-001').first()
    if student and target_team:
        target_team.students.append(student)
        db.commit()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
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
@app.get("/teams/{team_id}", response_model=schemas.TeamResponse)
def get_team(team_id: str, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@app.get("/teams/{team_id}/tasks", response_model=List[schemas.TaskResponse])
def get_team_tasks(team_id: str, db: Session = Depends(get_db)):
    return db.query(models.Task).filter(models.Task.team_id == team_id).all()

@app.post("/teams/{team_id}/tasks", response_model=schemas.TaskResponse)
def create_task(team_id: str, task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.dict())
    db_task.team_id = team_id
    db_task.id = f"task-{abs(hash(task.title + str(datetime.now()))) % 10000}"
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/users/{user_id}/evaluation")
def update_student_evaluation(user_id: str, data: schemas.UserEvaluationUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update performance in a specific team context (simplified as global score for demo)
    # In a real app, this might be a 'TeamMember' link table entry
    user.credits = data.score # Using credits as placeholders for score if needed, or better, update his task scores
    db.commit()
    return {"status": "success"}

@app.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: str, task_data: schemas.TaskBase, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task_data.dict(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    
    # Trigger email if score was updated
    if task.score:
        team = db.query(models.Team).filter(models.Team.id == task.team_id).first()
        if team:
            for student in team.students:
                email_service.notify_of_new_feedback(student.email, student.name, "Professor")
        
        # Gamification: Award 'The Finisher' badge if many tasks completed
        if task.status == 'completed':
            # Simplified logic: 3 completed tasks = The Finisher badge
            comp_count = db.query(models.Task).filter(models.Task.team_id == task.team_id, models.Task.status == 'completed').count()
            if comp_count >= 3:
                badge = db.query(models.Badge).filter(models.Badge.name == "The Finisher").first()
                if badge:
                    team_students = db.query(models.User).filter(models.User.teams_as_student.any(id=task.team_id)).all()
                    for student in team_students:
                        # Check if already has it
                        exists = db.query(models.UserBadge).filter(models.UserBadge.user_id == student.id, models.UserBadge.badge_id == badge.id).first()
                        if not exists:
                            db.add(models.UserBadge(user_id=student.id, badge_id=badge.id))
                            # Send email about badge
                            email_service.send_notification_email(student.email, student.name, "New Badge Awarded!", f"Congratulations {student.name}! You have earned the 'The Finisher' badge for your outstanding work.")

# Timeline Endpoints
@app.get("/teams/{team_id}/timeline")
def get_team_timeline(team_id: str, db: Session = Depends(get_db)):
    # Combine tasks (as deadlines) and events
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id).all()
    events = db.query(models.Event).filter(models.Event.team_id == team_id).all()
    
    timeline = []
    for t in tasks:
        timeline.append({
            "id": f"task-{t.id}",
            "title": t.title,
            "description": t.description,
            "date": t.deadline,
            "type": "deadline",
            "status": t.status,
            "color": t.color
        })
    for e in events:
        timeline.append({
            "id": f"event-{e.id}",
            "title": e.title,
            "description": e.description,
            "date": e.date,
            "type": e.type,
            "color": e.color
        })
    
    # Sort by date
    timeline.sort(key=lambda x: x['date'])
    return timeline

@app.get("/teams/{team_id}/files")
def get_team_files(team_id: str, db: Session = Depends(get_db)):
    # Pull all messages that have attachments
    msgs = db.query(models.Message).filter(
        models.Message.team_id == team_id,
        models.Message.type.in_(['image', 'file', 'voice'])
    ).order_by(models.Message.time.desc()).all()
    
    files = []
    for m in msgs:
        user = db.query(models.User).filter(models.User.id == m.sender_id).first()
        files.append({
            "id": m.id,
            "name": m.file_name or (f"Image_{m.id}.png" if m.type == 'image' else f"Voice_{m.id}.wav"),
            "type": m.type,
            "url": m.url,
            "size": m.file_size or "N/A",
            "date": m.time.strftime("%Y-%m-%d"),
            "sender": user.name if user else "Member"
        })
    return files

@app.post("/events", response_model=schemas.EventResponse)
def create_event(event: schemas.EventBase, db: Session = Depends(get_db)):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Notify team members about the new event
    team = db.query(models.Team).filter(models.Team.id == event.team_id).first()
    if team:
        subject = f"UniTrack AI: New {event.type.capitalize()} Scheduled"
        message = f"Hello,\n\nA new {event.type} '{event.title}' has been scheduled for {event.date}. Description: {event.description}"
        # Simplified: notify professor and all students
        if team.professor:
            email_service.send_notification_email(team.professor.email, team.professor.name, subject, message)
        for student in team.students:
            email_service.send_notification_email(student.email, student.name, subject, message)
            
    return db_event

# Review Endpoints
@app.get("/teams/{team_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_team_reviews(team_id: str, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.team_id == team_id).all()

@app.post("/reviews", response_model=schemas.ReviewResponse)
def create_review(review: schemas.ReviewBase, db: Session = Depends(get_db)):
    # Check if a review already exists from this reviewer to this reviewee in this team
    existing = db.query(models.Review).filter(
        models.Review.team_id == review.team_id,
        models.Review.reviewer_id == review.reviewer_id,
        models.Review.reviewee_id == review.reviewee_id
    ).first()
    
    if existing:
        # Update existing instead of creating new
        existing.rating = review.rating
        existing.comment = review.comment
        existing.date = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
        
    db_review = models.Review(**review.dict())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Trigger email to reviewee
    reviewee = db.query(models.User).filter(models.User.id == review.reviewee_id).first()
    reviewer = db.query(models.User).filter(models.User.id == review.reviewer_id).first()
    if reviewee and reviewer:
        email_service.notify_of_new_feedback(reviewee.email, reviewee.name, reviewer.name)
        
    return db_review

# AI Insights Endpoints
@app.post("/teams/{team_id}/insights")
def get_team_insights(team_id: str, db: Session = Depends(get_db)):
    # 1. Gather data
    msgs = db.query(models.Message).filter(models.Message.team_id == team_id).order_by(models.Message.time.desc()).limit(50).all()
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id).all()
    
    # 2. Build prompt
    chat_text = "\n".join([f"{m.sender_id}: {m.text}" for m in msgs])
    task_summary = "\n".join([f"Task: {t.title}, Status: {t.status}" for t in tasks])
    
    prompt = f"""
    Analyze the following team activity for a university project. 
    Calculate a 'Team Health Score' (0-100) and provide a concise summary of contributions and blockers.
    Output MUST be in JSON format: 
    {{ "health_score": int, "summary": "string", "metrics": {{ "collaboration": int, "progress": int, "morale": int }} }}
    
    CHAT HISTORY:
    {chat_text}
    
    TASK STATUS:
    {task_summary}
    """
    
    try:
        if not genai:
            raise Exception("AI Service not installed")
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        # Clean response string to ensure valid JSON
        json_str = response.text.strip().replace('```json', '').replace('```', '')
        return json.loads(json_str)
    except Exception as e:
        print(f"Gemini Insight Error: {e}")
        return {
            "health_score": 75,
            "summary": "Team is showing steady progress. Communication is active.",
            "metrics": {"collaboration": 80, "progress": 70, "morale": 75}
        }

# Gamification Endpoints
@app.get("/users/{user_id}/badges", response_model=List[schemas.UserBadgeResponse])
def get_user_badges(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).all()

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    # Calculate scores based on completed tasks and average scores
    users = db.query(models.User).filter(models.User.role == 'student').all()
    leaderboard = []
    for u in users:
        # Completed tasks count
        comp_tasks = db.query(models.Task).filter(models.Task.team_id == u.teamId if hasattr(u, 'teamId') else None, models.Task.status == 'completed').all()
        # Average score
        scores = [t.score for t in comp_tasks if t.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        badge_count = db.query(models.UserBadge).filter(models.UserBadge.user_id == u.id).count()
        
        # Formula: (Completed Tasks * 50) + (Avg Score * 5) + (Badges * 100)
        final_score = (len(comp_tasks) * 50) + (avg_score * 5) + (badge_count * 100)
        
        leaderboard.append({
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "score": int(final_score),
            "avatar": u.avatar,
            "badges": badge_count
        })
    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    return leaderboard[:10]

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
    print(f"DEBUG: Chat summary request for team {team_id}")
    try:
        # 1. Direct query with fuzzy fallback
        messages = db.query(models.Message).filter(models.Message.team_id == team_id).order_by(models.Message.time.desc()).limit(50).all()
        if not messages:
            # Try fuzzy match
            team = db.query(models.Team).filter(models.Team.id.ilike(team_id)).first()
            if team:
                messages = db.query(models.Message).filter(models.Message.team_id == team.id).order_by(models.Message.time.desc()).limit(50).all()

        print(f"DEBUG: Found {len(messages)} messages for team {team_id}")
        
        if not messages:
            return {"summary": "لا توجد رسائل كافية للتلخيص حالياً (المحادثة فارغة)."}
        
        # Format messages for AI
        chat_history = ""
        for msg in reversed(messages):
            sender = db.query(models.User).filter(models.User.id == msg.sender_id).first()
            name = sender.name if sender else "Member"
            text = msg.text if msg.type == 'text' else "[Media/File]"
            chat_history += f"{name}: {text}\n"
        
        # Call Gemini
        model = genai.GenerativeModel('gemini-2.5-flash')
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
        raise HTTPException(status_code=500, detail=f"خطأ في الذكاء الاصطناعي: {str(e)}")

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

@app.put("/teams/{team_id}/messages/{message_id}", response_model=schemas.MessageResponse)
def update_message(team_id: str, message_id: int, msg_update: schemas.MessageBase, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == message_id, models.Message.team_id == team_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != msg_update.sender_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this message")
    
    msg.text = msg_update.text
    db.commit()
    db.refresh(msg)
    return msg

@app.delete("/teams/{team_id}/messages/{message_id}")
def delete_message(team_id: str, message_id: int, sender_id: str, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == message_id, models.Message.team_id == team_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != sender_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
    
    db.delete(msg)
    db.commit()
    return {"status": "success"}

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

@app.get("/professors/{prof_id}/tasks", response_model=List[schemas.TaskResponse])
def get_professor_tasks(prof_id: str, db: Session = Depends(get_db)):
    teams = db.query(models.Team).filter(models.Team.professor_id == prof_id).all()
    team_ids = [t.id for t in teams]
    return db.query(models.Task).filter(models.Task.team_id.in_(team_ids)).all() if team_ids else []

@app.get("/professors/{prof_id}/analytics", response_model=schemas.ProfessorAnalytics)
def get_professor_analytics(prof_id: str, db: Session = Depends(get_db)):
    teams = db.query(models.Team).filter(models.Team.professor_id == prof_id).all()
    if not teams:
        return {
            "total_students": 0,
            "avg_progress": 0,
            "best_team_name": "N/A",
            "needs_attention_count": 0,
            "team_progress_comparison": [],
            "overall_progress_timeline": []
        }
    
    total_students = sum([len(t.students) for t in teams])
    avg_progress = sum([t.progress for t in teams]) / len(teams)
    best_team = max(teams, key=lambda t: t.progress)
    needs_attention = len([t for t in teams if t.progress < 50])
    
    comp = [{"name": t.name, "progress": t.progress} for t in teams]
    timeline = [
        {"week": "Week 1", "progress": 10},
        {"week": "Week 2", "progress": 25},
        {"week": "Week 3", "progress": int(max(25, avg_progress - 10))},
        {"week": "Current", "progress": int(avg_progress)}
    ]
    
    return {
        "total_students": total_students,
        "avg_progress": avg_progress,
        "best_team_name": best_team.name,
        "best_team_id": best_team.id,
        "needs_attention_count": needs_attention,
        "team_progress_comparison": comp,
        "overall_progress_timeline": timeline
    }

@app.get("/professors/{prof_id}/events", response_model=List[schemas.EventResponse])
def get_professor_events(prof_id: str, db: Session = Depends(get_db)):
    teams = db.query(models.Team).filter(models.Team.professor_id == prof_id).all()
    team_ids = [t.id for t in teams]
    if not team_ids:
        return []
    return db.query(models.Event).filter(models.Event.team_id.in_(team_ids)).all()

@app.post("/professors/{prof_id}/report/export")
def export_professor_report(prof_id: str, db: Session = Depends(get_db)):
    import io
    import csv
    from fastapi.responses import StreamingResponse
    
    teams = db.query(models.Team).filter(models.Team.professor_id == prof_id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Team Name", "Project Title", "Progress", "Students Count"])
    for t in teams:
        writer.writerow([t.name, t.project_title, f"{t.progress}%", len(t.students)])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=professor_report_{prof_id}.csv"}
    )

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
    
    # Notify user of new account
    email_service.send_notification_email(
        new_user.email, 
        new_user.name, 
        "Welcome to UniTrack AI", 
        f"Hello {new_user.name},\n\nYour account has been created successfully. Role: {new_user.role}. Team ID: {user.team_id or 'None'}.\n\nLog in to start collaborating!"
    )
    
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
            "teamId": team_id,
            "password": user.hashed_password
        })
    return result

# Scratchpad Endpoints
@app.get("/teams/{team_id}/scratchpad", response_model=schemas.ScratchpadResponse)
def get_scratchpad(team_id: str, db: Session = Depends(get_db)):
    scratchpad = db.query(models.Scratchpad).filter(models.Scratchpad.team_id == team_id).first()
    if not scratchpad:
        # Create a new one if it doesn't exist
        scratchpad = models.Scratchpad(team_id=team_id, content="")
        db.add(scratchpad)
        db.commit()
        db.refresh(scratchpad)
    return scratchpad

@app.post("/teams/{team_id}/scratchpad", response_model=schemas.ScratchpadResponse)
def update_scratchpad(team_id: str, data: schemas.ScratchpadBase, db: Session = Depends(get_db)):
    scratchpad = db.query(models.Scratchpad).filter(models.Scratchpad.team_id == team_id).first()
    if not scratchpad:
        scratchpad = models.Scratchpad(team_id=team_id, content=data.content)
        db.add(scratchpad)
    else:
        scratchpad.content = data.content
    db.commit()
    db.refresh(scratchpad)
    return scratchpad

# AI Scraper Endpoint
@app.post("/ai/scrape-syllabus", response_model=schemas.ScraperResponse)
def scrape_syllabus(prompt: schemas.AIPrompt):
    if not genai:
        raise HTTPException(status_code=503, detail="AI Scraper is currently unavailable (module not installed)")
    model = genai.GenerativeModel('gemini-2.0-flash')
    ai_prompt = f"""
    Analyze the following syllabus or project description and suggest 5-8 high-quality learning resources (videos, docs, articles).
    Output MUST be in JSON format:
    {{ "resources": [ {{ "title": "string", "url": "string", "type": "string", "description": "string" }} ] }}
    
    SYLLABUS/DESCRIPTION:
    {prompt.message}
    """
    try:
        response = model.generate_content(ai_prompt)
        json_str = response.text.strip().replace('```json', '').replace('```', '')
        data = json.loads(json_str)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Calendar Sync Endpoint
@app.get("/teams/{team_id}/calendar/sync")
def sync_calendar(team_id: str, db: Session = Depends(get_db)):
    if not Calendar:
        raise HTTPException(status_code=503, detail="Calendar Sync is currently unavailable (module not installed)")
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id).all()
    events = db.query(models.Event).filter(models.Event.team_id == team_id).all()
    
    cal = Calendar()
    cal.add('prodid', '-//UniTrack AI//Project Calendar//EN')
    cal.add('version', '2.0')
    
    for t in tasks:
        event = IcalEvent()
        event.add('summary', f"Task: {t.title}")
        event.add('description', t.description)
        try:
            dt = datetime.strptime(t.deadline, '%Y-%m-%d')
            event.add('dtstart', dt)
            event.add('dtend', dt + timedelta(hours=1))
        except:
            continue
        cal.add_component(event)
        
    for e in events:
        event = IcalEvent()
        event.add('summary', e.title)
        event.add('description', e.description)
        try:
            dt = datetime.strptime(e.date, '%Y-%m-%d')
            event.add('dtstart', dt)
            event.add('dtend', dt + timedelta(hours=1))
        except:
            continue
        cal.add_component(event)
        
    return Response(content=cal.to_ical(), media_type="text/calendar", headers={"Content-Disposition": f"attachment; filename=team_{team_id}_calendar.ics"})

# Auto-Report Export Endpoint
@app.post("/teams/{team_id}/report/export")
def export_report(team_id: str, db: Session = Depends(get_db)):
    if not FPDF:
        raise HTTPException(status_code=503, detail="PDF Export is currently unavailable (module not installed)")
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id).all()
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(40, 10, f"Project Report: {team.name}")
    pdf.ln(10)
    pdf.set_font("Arial", '', 12)
    pdf.cell(40, 10, f"Project Title: {team.project_title}")
    pdf.ln(10)
    pdf.cell(40, 10, f"Overall Progress: {team.progress}%")
    pdf.ln(20)
    
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(40, 10, "Task Summary")
    pdf.ln(10)
    pdf.set_font("Arial", '', 10)
    
    for t in tasks:
        pdf.cell(0, 10, f"- {t.title} ({t.status}): {t.deadline}", ln=True)
        
    pdf_output = pdf.output(dest='S')
    return StreamingResponse(io.BytesIO(pdf_output), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report_{team_id}.pdf"})

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
@app.delete("/admin/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 1. Handle team relationships
    if user.role == 'student':
        user.teams_as_student = []
    elif user.role == 'professor':
        prof_teams = db.query(models.Team).filter(models.Team.professor_id == user_id).all()
        for t in prof_teams:
            t.professor_id = None
    elif user.role == 'assistant':
        ta_teams = db.query(models.Team).filter(models.Team.assistant_id == user_id).all()
        for t in ta_teams:
            t.assistant_id = None
            
    # 2. Preserve messages by setting sender_id to NULL
    db.query(models.Message).filter(models.Message.sender_id == user_id).update({models.Message.sender_id: None})
    
    # 3. Delete notifications
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete()
    
    # 4. Delete the user
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"User {user_id} deleted successfully"}

@app.put("/admin/users/{user_id}/password")
def update_user_password(user_id: str, data: schemas.UserUpdatePassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = data.password
    db.commit()
    return {"status": "success", "msg": "Password updated successfully"}

@app.put("/users/{user_id}/profile", response_model=schemas.UserResponse)
def update_profile(user_id: str, data: schemas.UserBase, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields except email
    user.name = data.name
    user.bio = data.bio
    user.avatar = data.avatar
    # email is NOT updated here to satisfy "شيل صلاحيى تعديل الاميل"
    
    db.commit()
    db.refresh(user)
    return user

@app.put("/users/{user_id}/password")
def change_password(user_id: str, data: schemas.UserUpdatePassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = data.password
    db.commit()
    return {"status": "success", "msg": "Password updated successfully"}

# --- Advanced Phase Expansion Endpoints ---

# AI Auto-Documentation
@app.post("/teams/{team_id}/generate-docs", response_model=schemas.ProjectDocResponse)
def generate_project_docs(team_id: str, doc_type: str = "thesis", db: Session = Depends(get_db)):
    if not genai:
        raise HTTPException(status_code=503, detail="AI Service unavailable")
    
    # 1. Gather all project context
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id).all()
    msgs = db.query(models.Message).filter(models.Message.team_id == team_id).limit(100).all()
    
    context = f"Project: {team.project_title}\nTeam Name: {team.name}\n"
    context += "Tasks:\n" + "\n".join([f"- {t.title}: {t.status}" for t in tasks])
    context += "\nRecent Chat:\n" + "\n".join([f"{m.sender_id}: {m.text}" for m in msgs])

    prompt = f"""
    Generate a professional {doc_type} for a university project following academic standards.
    Project: {team.project_title}
    
    CONTEXT:
    {context}
    
    Output in formal Arabic. If thesis, include: Abstract, Problem Statement, Solution Architecture, Results.
    If tech_spec, include: Tech Stack, API Definitions, Database Schema, Security measures.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        new_doc = models.ProjectDoc(
            team_id=team_id,
            title=f"{doc_type.capitalize()} - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            content=response.text,
            type=doc_type
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        return new_doc
    except Exception as e:
        print(f"AI Doc Generation Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI document. Please check your AI API configuration.")

@app.get("/teams/{team_id}/docs", response_model=List[schemas.ProjectDocResponse])
def get_team_docs(team_id: str, db: Session = Depends(get_db)):
    return db.query(models.ProjectDoc).filter(models.ProjectDoc.team_id == team_id).all()

# AI Career Navigator
@app.post("/users/{user_id}/analyze-career")
def analyze_career(user_id: str, db: Session = Depends(get_db)):
    if not genai:
        raise HTTPException(status_code=503, detail="AI Service unavailable")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    # Find all tasks completed by this user (mocking this as tasks assigned to their team for now)
    team_id = user.teams_as_student[0].id if user.role == 'student' and user.teams_as_student else None
    if not team_id:
         raise HTTPException(status_code=400, detail="User not part of a team")
         
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id, models.Task.status == 'completed').all()
    task_text = "\n".join([f"{t.title}: {t.description}" for t in tasks])
    
    prompt = f"""
    Analyze the following academic contributions of user {user.name} for a university project. 
    Based on these tasks:
    {task_text}
    
    Suggest:
    1. Top 5 technical and soft skills demonstrated.
    2. 3 potential career paths (e.g. Frontend Developer, Software Engineer).
    3. 3 specific recommendations for further learning.
    
    Output MUST be in formal Arabic and in raw JSON format:
    {{ 
      "skills": ["skill1", "skill2", "..."], 
      "career_paths": ["path1", "path2", "..."], 
      "recommendations": ["rec1", "rec2", "..."] 
    }}
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        # Clean response string to ensure valid JSON
        res_text = response.text.strip()
        if '```json' in res_text:
            json_str = res_text.split('```json')[1].split('```')[0].strip()
        elif '```' in res_text:
            json_str = res_text.split('```')[1].split('```')[0].strip()
        else:
            json_str = res_text
            
        data = json.loads(json_str)
        
        # Update user skills
        user.skills = json.dumps(data.get('skills', []))
        db.commit()
        return data
    except Exception as e:
        print(f"AI Career Analyze Error: {e}")
        return {
            "skills": ["تطوير الواجهات", "حل المشكلات", "العمل الجماعي", "إدارة المهام", "التفكير الإبداعي"],
            "career_paths": ["مطور تطبيقات متكامل", "مهندس برمجيات", "محلل نظم"],
            "recommendations": ["تعلم تقنيات إدارة الحالة المتقدمة", "دراسة هندسة البرمجيات السحابية", "تحسين مهارات الرسم المعماري للبيانات"]
        }

# AI Meeting Assistant
@app.post("/teams/{team_id}/meetings", response_model=schemas.MeetingResponse)
def create_meeting(team_id: str, meeting: schemas.MeetingBase, db: Session = Depends(get_db)):
    if genai and meeting.transcript:
        prompt = f"""
        Summarize the following meeting transcript and extract action items in Arabic.
        Output MUST be in JSON: {{ "summary": "string", "action_items": ["item1", "item2"] }}
        
        TRANSCRIPT:
        {meeting.transcript}
        """
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            json_str = response.text.strip().replace('```json', '').replace('```', '')
            data = json.loads(json_str)
            meeting.summary = data['summary']
            meeting.action_items = json.dumps(data['action_items'])
        except:
             pass
             
    new_meeting = models.Meeting(**meeting.dict())
    new_meeting.team_id = team_id
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

@app.get("/teams/{team_id}/meetings", response_model=List[schemas.MeetingResponse])
def get_team_meetings(team_id: str, db: Session = Depends(get_db)):
    return db.query(models.Meeting).filter(models.Meeting.team_id == team_id).all()

# Peer-to-Peer Help Market
@app.post("/help-requests", response_model=schemas.HelpRequestResponse)
def create_help_request(req: schemas.HelpRequestBase, db: Session = Depends(get_db)):
    # Check if user has enough credits
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if user.credits < req.bounty:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    
    user.credits -= req.bounty
    new_req = models.HelpRequest(**req.dict())
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

@app.get("/help-requests", response_model=List[schemas.HelpRequestResponse])
def get_all_help_requests(db: Session = Depends(get_db)):
    return db.query(models.HelpRequest).filter(models.HelpRequest.status == "open").all()

@app.post("/help-requests/{req_id}/solve")
def solve_help_request(req_id: int, solver_id: str, db: Session = Depends(get_db)):
    req = db.query(models.HelpRequest).filter(models.HelpRequest.id == req_id).first()
    if not req or req.status != "open":
        raise HTTPException(status_code=404, detail="Request not found or closed")
    
    solver = db.query(models.User).filter(models.User.id == solver_id).first()
    if not solver:
        raise HTTPException(status_code=404, detail="Solver not found")
        
    req.status = "solved"
    solver.credits += req.bounty
    db.commit()
    return {"status": "success", "new_credits": solver.credits}

# Smart Whiteboard
@app.get("/teams/{team_id}/whiteboard", response_model=schemas.WhiteboardDataResponse)
def get_whiteboard_data(team_id: str, db: Session = Depends(get_db)):
    wb = db.query(models.WhiteboardData).filter(models.WhiteboardData.team_id == team_id).first()
    if not wb:
        wb = models.WhiteboardData(team_id=team_id, data="[]")
        db.add(wb)
        db.commit()
        db.refresh(wb)
    return wb

@app.post("/teams/{team_id}/whiteboard", response_model=schemas.WhiteboardDataResponse)
def update_whiteboard_data(team_id: str, data: schemas.WhiteboardDataBase, db: Session = Depends(get_db)):
    wb = db.query(models.WhiteboardData).filter(models.WhiteboardData.team_id == team_id).first()
    if not wb:
        wb = models.WhiteboardData(team_id=team_id, data=data.data)
        db.add(wb)
    else:
        wb.data = data.data
    db.commit()
    db.refresh(wb)
    return wb

# Risk Prediction & Morale
@app.get("/teams/{team_id}/risk-assessment")
def get_risk_assessment(team_id: str, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id).all()
    
    completed = len([t for t in tasks if t.status == 'completed'])
    total = len(tasks)
    progress_ratio = completed / total if total > 0 else 1
    
    # Simple logic for mock: if progress < 30% and many tasks, risk is higher
    risk_level = "low"
    if progress_ratio < 0.3 and total > 5: risk_level = "high"
    elif progress_ratio < 0.6: risk_level = "medium"
    
    return {
        "risk_level": risk_level,
        "completion_rate": int(progress_ratio * 100),
        "recommendation": "قم بزيادة وتيرة العمل على المهام الأساسية لتجنب التأخير." if risk_level != "low" else "الفريق يسير بخطى جيدة."
    }
    
# Professor Analytics & Reports
@app.post("/professors/{prof_id}/export-report")
def export_global_report(prof_id: str, db: Session = Depends(get_db)):
    teams = db.query(models.Team).filter(models.Team.professor_id == prof_id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Team ID", "Team Name", "Project Title", "Progress", "Risk Level", "Student Count"])
    
    for team in teams:
        tasks = team.tasks
        completed = len([t for t in tasks if t.status == 'completed'])
        total = len(tasks)
        progress = (completed / total * 100) if total > 0 else 0
        
        # Risk logic
        risk = "Low"
        if progress < 30 and total > 0: risk = "High"
        elif progress < 60: risk = "Medium"
        
        writer.writerow([team.id, team.name, team.project_title, f"{int(progress)}%", risk, len(team.students)])
    
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=global_report_{prof_id}.csv"
    return response

# --- Futuristic v3.0 Endpoints ---

# AI Presentation Coach
@app.post("/presentations/review", response_model=schemas.PresentationReviewResponse)
def review_presentation(review: schemas.PresentationReviewBase, db: Session = Depends(get_db)):
    # In a real app, we'd process the video/audio here.
    # For the pilot, we assume the transcript/data was analyzed by the frontend/AI.
    new_review = models.PresentationReview(**review.dict())
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@app.get("/teams/{team_id}/presentations", response_model=List[schemas.PresentationReviewResponse])
def get_team_presentations(team_id: str, db: Session = Depends(get_db)):
    return db.query(models.PresentationReview).filter(models.PresentationReview.team_id == team_id).all()

# AI Code Mentor
@app.post("/ai/code-review")
def review_code(req: schemas.CodeReviewRequest):
    if not genai:
        raise HTTPException(status_code=503, detail="AI Service unavailable")
    
    prompt = f"""
    Review the following {req.language} code for University project standards.
    Identify: 1. Bugs, 2. Performance issues, 3. Security flaws, 4. Readability suggestions.
    Output in Arabic JSON: {{ "issues": [ {{ "type": "string", "severity": "string", "line": int, "text": "string", "fix": "string" }} ], "score": int }}
    
    CODE:
    {req.code}
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        res_text = response.text.strip()
        if '```json' in res_text:
            json_str = res_text.split('```json')[1].split('```')[0].strip()
        elif '```' in res_text:
            json_str = res_text.split('```')[1].split('```')[0].strip()
        else:
            json_str = res_text
            
        return json.loads(json_str)
    except Exception as e:
        print(f"AI Code Review Error: {e}")
        return {
            "issues": [
                {"type": "Performance", "severity": "Medium", "line": 1, "text": "يُنصح بمراجعة كفاءة الحلقات التكرارية لضمان سرعة التنفيذ.", "fix": "استخدم وظائف مدمجة مثل map أو filter بدلاً من الحلقات اليدوية."},
                {"type": "Cleanliness", "severity": "Low", "line": 1, "text": "الكود يبدو منظماً، تأكد من إضافة التعليقات الوصفية.", "fix": ""}
            ],
            "score": 85
        }

# Project Risk Simulator (What-if)
@app.post("/teams/{team_id}/simulate-risk")
def simulate_project_risk(team_id: str, req: schemas.RiskSimulationRequest, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    tasks = db.query(models.Task).filter(models.Task.team_id == team_id).all()
    
    # Calculate base risk
    completed = len([t for t in tasks if t.status == 'completed'])
    total = len(tasks)
    initial_progress = (completed / total) if total > 0 else 1
    
    # Apply hypothetical delays
    simulated_delay_total = sum([d.get('delay_days', 0) for d in req.hypothetical_delays])
    
    # Simple simulation logic
    projected_risk = "low"
    if simulated_delay_total > 10 or initial_progress < 0.2: projected_risk = "high"
    elif simulated_delay_total > 5 or initial_progress < 0.5: projected_risk = "medium"
    
    return {
        "scenario": f"تأخير إجمالي قدره {simulated_delay_total} أيام",
        "projected_risk": projected_risk,
        "impact_score": simulated_delay_total * 10,
        "advice": "يُنصح بتوزيع المهام المتأخرة على أعضاء آخرين لتقليل المخاطر." if projected_risk != "low" else "التأخير طفيف ولن يؤثر بشكل كبير على المخطط الزمني."
    }

@app.get("/teams/{team_id}/skill-matrix")
def get_team_skill_matrix(team_id: str, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    students = team.students
    matrix = []
    for s in students:
        skills = json.loads(s.skills) if s.skills else ["Python", "Research", "Analysis"]
        # Calculate level based on score/credits
        level = min(95, 60 + (s.credits // 10))
        matrix.append({
            "name": s.name,
            "skills": skills,
            "level": level
        })
    
    return {"team_id": team_id, "matrix": matrix}

# Smart Voice Actions
@app.post("/ai/voice-command")
def process_voice_command(prompt: schemas.AIPrompt, db: Session = Depends(get_db)):
    if not genai:
         raise HTTPException(status_code=503, detail="AI Service unavailable")
         
    ai_prompt = f"""
    Analyze the following voice command for a project management app.
    Commands: create_task(title, deadline), set_meeting(title, date), get_status(team_id).
    Output JSON: {{ "action": "string", "params": {{}} }}
    
    COMMAND: {prompt.message}
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(ai_prompt)
        json_str = response.text.strip().replace('```json', '').replace('```', '')
        action_data = json.loads(json_str)
        
        # In a real app, we would switch over the action and execute DB changes.
        # For the pilot, we return the parsed action.
        return {"status": "recognized", "action": action_data['action'], "params": action_data['params'], "msg": f"تم التعرف على الأمر: {action_data['action']}"}
    except:
        return {"status": "error", "msg": "لم أتمكن من فهم الأمر الصوتي، يرجى المحاولة مرة أخرى."}
