from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str
    team_id: Optional[str] = None

class UserResponse(UserBase):
    teamId: Optional[str] = None
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    id: str
    team_id: str
    title: str
    description: str
    deadline: str
    status: str
    files_required: bool = False
    score: Optional[int] = None
    feedback: Optional[str] = None
    color: str

class TaskResponse(TaskBase):
    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    id: str
    name: str
    project_title: str
    progress: int = 0
    color: str
    emoji: str
    professor_id: Optional[str] = None
    assistant_id: Optional[str] = None

class TeamCreate(BaseModel):
    name: str
    project_title: str
    color: str = "#3b82f6"
    emoji: str = "🚀"

class TeamResponse(TeamBase):
    professor: Optional[UserResponse] = None
    assistant: Optional[UserResponse] = None
    students: List[UserResponse] = []
    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    team_id: str
    sender_id: str
    text: Optional[str] = None
    type: str = "text"
    url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[str] = None
    duration: Optional[int] = None

class MessageResponse(MessageBase):
    id: int
    time: datetime
    is_own: bool
    sender: Optional[str] = None
    role: Optional[str] = None
    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    time: str
    read: bool = False

class NotificationResponse(NotificationBase):
    id: int
    class Config:
        from_attributes = True

class AdminStats(BaseModel):
    total_users: int
    total_teams: int
    total_tasks: int
    avg_progress: float

class LoginRequest(BaseModel):
    email: str
    password: str

class AIPrompt(BaseModel):
    message: str
    context: Optional[str] = None
