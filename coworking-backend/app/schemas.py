from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    karma: int
    total_donated: float
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class VisitBase(BaseModel):
    user_id: int

class VisitCreate(VisitBase):
    pass

class VisitResponse(VisitBase):
    id: int
    check_in: datetime
    check_out: Optional[datetime] = None
    duration_minutes: int
    
    class Config:
        from_attributes = True

class DonationBase(BaseModel):
    amount: float
    message: Optional[str] = None
    is_anonymous: bool = False

    @field_validator('amount')
    def validate_amount(cls, v):
        if v < 10:
            raise ValueError('Minimum donation amount is 10 rubles')
        return v

class DonationCreate(DonationBase):
    user_id: int

class DonationResponse(DonationBase):
    id: int
    user_id: int
    donation_date: datetime
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_users: int
    active_users_today: int
    total_visits: int
    total_donations: float
    average_visit_duration: float
    daily_active_users: dict
    monthly_active_users: dict
    donation_stats: dict

class UserStats(BaseModel):
    user: UserResponse
    total_visits: int
    total_donation: float
    average_duration: float
    last_visit: Optional[datetime] = None

# Room schemas
class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int
    equipment: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    equipment: Optional[str] = None
    is_active: Optional[bool] = None

class RoomResponse(RoomBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Booking schemas
class BookingBase(BaseModel):
    room_id: int
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None

    @field_validator('end_time')
    def validate_end_time(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('End time must be after start time')
        return v

    @field_validator('start_time')
    def validate_start_time(cls, v):
        if v < datetime.utcnow():
            raise ValueError('Start time cannot be in the past')
        return v

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    purpose: Optional[str] = None
    status: Optional[str] = None

class BookingResponse(BookingBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    room: RoomResponse
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class BookingAvailability(BaseModel):
    room_id: int
    room_name: str
    available_slots: List[dict]  # List of available time slots