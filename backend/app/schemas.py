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
    credits: int = 100
    skills: Optional[str] = None

class UserCreate(UserBase):
    password: str
    team_id: Optional[str] = None

class UserResponse(UserBase):
    teamId: Optional[str] = None
    class Config:
        from_attributes = True

class UserUpdateTeam(BaseModel):
    team_id: Optional[str] = None

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

class EventBase(BaseModel):
    team_id: str
    title: str
    description: Optional[str] = None
    date: str
    type: str = "milestone"
    color: str = "#3b82f6"

class EventResponse(EventBase):
    id: int
    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    team_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int
    comment: Optional[str] = None

class ReviewResponse(ReviewBase):
    id: int
    date: datetime
    class Config:
        from_attributes = True

class BadgeBase(BaseModel):
    name: str
    description: str
    icon: str
    color: str

class BadgeResponse(BadgeBase):
    id: int
    class Config:
        from_attributes = True

class UserBadgeResponse(BaseModel):
    id: int
    user_id: str
    badge_id: int
    date_earned: datetime
    badge: BadgeResponse
    class Config:
        from_attributes = True

class ScratchpadBase(BaseModel):
    team_id: str
    content: str

class ScratchpadResponse(ScratchpadBase):
    last_updated: datetime
    class Config:
        from_attributes = True

class AdminStats(BaseModel):
    total_users: int
    total_teams: int
    total_tasks: int
    avg_progress: float

class ResourceBase(BaseModel):
    title: str
    url: str
    type: str
    description: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: int
    team_id: str
    class Config:
        from_attributes = True

class ScraperResponse(BaseModel):
    resources: List[ResourceBase]

class LoginRequest(BaseModel):
    email: str
    password: str

class AIPrompt(BaseModel):
    message: str
    context: Optional[str] = None

class MeetingBase(BaseModel):
    team_id: str
    title: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    action_items: Optional[str] = None

class MeetingResponse(MeetingBase):
    id: int
    date: datetime
    class Config:
        from_attributes = True

class ProjectDocBase(BaseModel):
    team_id: str
    title: str
    content: str
    type: str

class ProjectDocResponse(ProjectDocBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class HelpRequestBase(BaseModel):
    team_id: str
    user_id: str
    title: str
    description: str
    bounty: int = 10

class HelpRequestResponse(HelpRequestBase):
    id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class WhiteboardDataBase(BaseModel):
    team_id: str
    data: str

class WhiteboardDataResponse(WhiteboardDataBase):
    id: int
    last_updated: datetime
    class Config:
        from_attributes = True

class PresentationReviewBase(BaseModel):
    user_id: str
    team_id: str
    title: str
    review_json: str
    score: int

class PresentationReviewResponse(PresentationReviewBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class CodeReviewRequest(BaseModel):
    code: str
    language: str

class RiskSimulationRequest(BaseModel):
    team_id: str
    hypothetical_delays: List[dict] # e.g. [{"task_id": "T1", "delay_days": 5}]

class SkillMatrixResponse(BaseModel):
    team_id: str
    matrix: List[dict]
