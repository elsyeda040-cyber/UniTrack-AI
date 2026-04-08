from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

# Association table for Team-Student relationship
team_students = Table(
    'team_students',
    Base.metadata,
    Column('team_id', String, ForeignKey('teams.id')),
    Column('student_id', String, ForeignKey('users.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String) # student, professor, assistant, admin
    avatar = Column(String, nullable=True)
    hashed_password = Column(String) # For simple auth
    bio = Column(String, nullable=True)
    credits = Column(Integer, default=100)
    skills = Column(String, nullable=True) # JSON string of skills
    
    # Relationships
    teams_as_student = relationship("Team", secondary=team_students, back_populates="students")
    teams_as_professor = relationship("Team", back_populates="professor", foreign_keys="[Team.professor_id]")
    teams_as_assistant = relationship("Team", back_populates="assistant", foreign_keys="[Team.assistant_id]")

class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    project_title = Column(String)
    progress = Column(Integer, default=0)
    color = Column(String)
    emoji = Column(String)
    
    professor_id = Column(String, ForeignKey('users.id'))
    assistant_id = Column(String, ForeignKey('users.id'))
    
    # Relationships
    professor = relationship("User", back_populates="teams_as_professor", foreign_keys=[professor_id])
    assistant = relationship("User", back_populates="teams_as_assistant", foreign_keys=[assistant_id])
    students = relationship("User", secondary=team_students, back_populates="teams_as_student")
    tasks = relationship("Task", back_populates="team")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    title = Column(String)
    description = Column(String)
    deadline = Column(String)
    status = Column(String) # todo, in_progress, completed
    files_required = Column(Boolean, default=False)
    score = Column(Integer, nullable=True)
    feedback = Column(String, nullable=True)
    color = Column(String)
    
    # Relationships
    team = relationship("Team", back_populates="tasks")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    sender_id = Column(String, ForeignKey('users.id'))
    text = Column(String, nullable=True)
    type = Column(String, default="text") # text, voice, image, file
    url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)
    time = Column(DateTime, default=datetime.utcnow)
    is_own = Column(Boolean) # This is usually dynamic based on current user, but stored for reference

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    title = Column(String)
    description = Column(String, nullable=True)
    date = Column(String) # ISO date string
    type = Column(String, default="milestone") # milestone, meeting, deadline
    color = Column(String, default="#3b82f6")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    reviewer_id = Column(String, ForeignKey('users.id'))
    reviewee_id = Column(String, ForeignKey('users.id'))
    rating = Column(Integer) # 1-5
    comment = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    icon = Column(String) # Lucide icon name or emoji
    color = Column(String)

class UserBadge(Base):
    __tablename__ = "user_badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.id'))
    badge_id = Column(Integer, ForeignKey('badges.id'))
    date_earned = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.id'))
    type = Column(String)
    title = Column(String)
    message = Column(String)
    time = Column(String) # e.g., "5 min ago" or ISO string
    read = Column(Boolean, default=False)

class Scratchpad(Base):
    __tablename__ = "scratchpads"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'), unique=True)
    content = Column(String, default="")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    title = Column(String)
    url = Column(String)
    type = Column(String) # e.g., "video", "article", "documentation"
    description = Column(String, nullable=True)

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    title = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    transcript = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    action_items = Column(String, nullable=True) # JSON string

class ProjectDoc(Base):
    __tablename__ = "project_docs"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    title = Column(String)
    content = Column(String)
    type = Column(String) # e.g., "thesis", "technical_spec", "summary"
    created_at = Column(DateTime, default=datetime.utcnow)

class HelpRequest(Base):
    __tablename__ = "help_requests"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'))
    user_id = Column(String, ForeignKey('users.id'))
    title = Column(String)
    description = Column(String)
    bounty = Column(Integer, default=10)
    status = Column(String, default="open") # open, closed, solved
    created_at = Column(DateTime, default=datetime.utcnow)

class WhiteboardData(Base) :
    __tablename__ = "whiteboard_data"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, ForeignKey('teams.id'), unique=True)
    data = Column(String) # JSON string of canvas state
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PresentationReview(Base):
    __tablename__ = "presentation_reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.id'))
    team_id = Column(String, ForeignKey('teams.id'))
    title = Column(String)
    review_json = Column(String) # Detailed AI feedback JSON
    score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
