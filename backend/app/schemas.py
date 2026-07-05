"""Pydantic schemas for request validation and response serialization."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import ActivityType, LeadStatus


# --- Auth ---
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# --- Activity ---
class ActivityCreate(BaseModel):
    type: ActivityType = ActivityType.note
    content: str = Field(min_length=1)


class ActivityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: ActivityType
    content: str
    created_at: datetime


# --- Lead ---
class LeadBase(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    category: str | None = None
    estimated_value: float | None = None
    notes: str | None = None


class LeadCreate(LeadBase):
    status: LeadStatus = LeadStatus.new
    score: float = 0.0


class LeadUpdate(BaseModel):
    """All fields optional for PATCH semantics."""
    company: str | None = Field(default=None, min_length=1, max_length=255)
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    category: str | None = None
    status: LeadStatus | None = None
    score: float | None = None
    estimated_value: float | None = None
    notes: str | None = None


class LeadPublic(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: LeadStatus
    score: float
    created_at: datetime
    updated_at: datetime


class LeadDetail(LeadPublic):
    activities: list[ActivityPublic] = []


class LeadList(BaseModel):
    items: list[LeadPublic]
    total: int
    page: int
    page_size: int


# --- Dashboard ---
class PipelineStat(BaseModel):
    status: LeadStatus
    count: int
    total_value: float


class DashboardStats(BaseModel):
    total_leads: int
    total_pipeline_value: float
    won_value: float
    conversion_rate: float
    by_status: list[PipelineStat]
