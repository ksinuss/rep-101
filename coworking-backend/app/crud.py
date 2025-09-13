from sqlalchemy.orm import Session
from . import models, schemas
from .utils.security import get_password_hash, verify_password
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import func, and_, or_

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user_karma(db: Session, user_id: int, karma_delta: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.karma += karma_delta
        db.commit()
        db.refresh(user)
    return user

def create_visit(db: Session, visit: schemas.VisitCreate):
    db_visit = models.Visit(**visit.dict())
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    update_user_karma(db, visit.user_id, 1)
    return db_visit

def get_visits(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Visit).offset(skip).limit(limit).all()

def get_user_visits(db: Session, user_id: int):
    return db.query(models.Visit).filter(models.Visit.user_id == user_id).all()

def check_out_visit(db: Session, visit_id: int):
    visit = db.query(models.Visit).filter(models.Visit.id == visit_id).first()
    if visit and not visit.check_out:
        visit.check_out = datetime.utcnow()
        duration = (visit.check_out - visit.check_in).total_seconds() / 60
        visit.duration_minutes = int(duration)
        db.commit()
        db.refresh(visit)
    return visit

def create_donation(db: Session, donation: schemas.DonationCreate):
    db_donation = models.Donation(**donation.dict())
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    
    karma_points = int(donation.amount / 50)
    if karma_points > 0:
        update_user_karma(db, donation.user_id, karma_points)
    
    user = db.query(models.User).filter(models.User.id == donation.user_id).first()
    if user:
        user.total_donated += donation.amount
        db.commit()
    
    return db_donation

def get_donations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Donation).order_by(models.Donation.donation_date.desc()).offset(skip).limit(limit).all()

def get_user_donations(db: Session, user_id: int):
    return db.query(models.Donation).filter(
        models.Donation.user_id == user_id
    ).order_by(models.Donation.donation_date.desc()).all()

def get_recent_donations(db: Session, limit: int = 10):
    return db.query(models.Donation).order_by(
        models.Donation.donation_date.desc()
    ).limit(limit).all()

def get_donations_stats(db: Session, days: int = 30):
    start_date = datetime.utcnow() - timedelta(days=days)
    
    total_amount = db.query(func.coalesce(func.sum(models.Donation.amount), 0)).filter(
        models.Donation.donation_date >= start_date
    ).scalar() or 0
    
    donation_count = db.query(func.count(models.Donation.id)).filter(
        models.Donation.donation_date >= start_date
    ).scalar() or 0
    
    avg_donation = total_amount / donation_count if donation_count > 0 else 0
    
    daily_stats = {}
    for i in range(days):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_amount = db.query(func.coalesce(func.sum(models.Donation.amount), 0)).filter(
            func.date(models.Donation.donation_date) == day
        ).scalar() or 0
        daily_stats[day.isoformat()] = float(day_amount)
    
    return {
        "total_amount": float(total_amount),
        "donation_count": donation_count,
        "average_donation": float(avg_donation),
        "daily_stats": daily_stats
    }

def get_dashboard_stats(db: Session):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    today = datetime.utcnow().date()
    
    active_users_today = db.query(func.count(models.Visit.user_id.distinct())).filter(
        func.date(models.Visit.check_in) == today
    ).scalar() or 0
    
    total_visits = db.query(func.count(models.Visit.id)).scalar() or 0
    total_donations = db.query(func.coalesce(func.sum(models.Donation.amount), 0)).scalar() or 0
    
    avg_duration = db.query(func.avg(models.Visit.duration_minutes)).filter(
        models.Visit.duration_minutes > 0
    ).scalar() or 0
    
    daily_active_users = {}
    for i in range(30):
        day = today - timedelta(days=i)
        dau = db.query(func.count(models.Visit.user_id.distinct())).filter(
            func.date(models.Visit.check_in) == day
        ).scalar() or 0
        daily_active_users[day.isoformat()] = dau
    
    monthly_active_users = {}
    for i in range(12):
        month_start = today.replace(day=1) - timedelta(days=30*i)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        mau = db.query(func.count(models.Visit.user_id.distinct())).filter(
            and_(
                models.Visit.check_in >= month_start,
                models.Visit.check_in < month_end
            )
        ).scalar() or 0
        monthly_active_users[month_start.strftime("%Y-%m")] = mau
    
    donation_stats = get_donations_stats(db, 30)
    
    return {
        "total_users": total_users,
        "active_users_today": active_users_today,
        "total_visits": total_visits,
        "total_donations": float(total_donations),
        "average_visit_duration": float(avg_duration),
        "daily_active_users": daily_active_users,
        "monthly_active_users": monthly_active_users,
        "donation_stats": donation_stats
    }

def get_user_statistics(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        return None
    
    total_visits = db.query(func.count(models.Visit.id)).filter(
        models.Visit.user_id == user_id
    ).scalar() or 0
    
    total_donation = db.query(func.coalesce(func.sum(models.Donation.amount), 0)).filter(
        models.Donation.user_id == user_id
    ).scalar() or 0
    
    avg_duration = db.query(func.avg(models.Visit.duration_minutes)).filter(
        models.Visit.user_id == user_id,
        models.Visit.duration_minutes > 0
    ).scalar() or 0
    
    last_visit = db.query(models.Visit).filter(
        models.Visit.user_id == user_id
    ).order_by(models.Visit.check_in.desc()).first()
    
    return {
        "user": user,
        "total_visits": total_visits,
        "total_donation": float(total_donation),
        "average_duration": float(avg_duration),
        "last_visit": last_visit.check_in if last_visit else None
    }

# Room CRUD operations
def create_room(db: Session, room: schemas.RoomCreate):
    db_room = models.Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def get_rooms(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True):
    query = db.query(models.Room)
    if active_only:
        query = query.filter(models.Room.is_active == True)
    return query.offset(skip).limit(limit).all()

def get_room(db: Session, room_id: int):
    return db.query(models.Room).filter(models.Room.id == room_id).first()

def get_room_by_name(db: Session, name: str):
    return db.query(models.Room).filter(models.Room.name == name).first()

def update_room(db: Session, room_id: int, room_update: schemas.RoomUpdate):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_room:
        update_data = room_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_room, field, value)
        db.commit()
        db.refresh(db_room)
    return db_room

def delete_room(db: Session, room_id: int):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_room:
        db_room.is_active = False
        db.commit()
        db.refresh(db_room)
    return db_room

# Booking CRUD operations
def create_booking(db: Session, booking: schemas.BookingCreate, user_id: int):
    # Check for conflicts
    conflicting_booking = db.query(models.Booking).filter(
        models.Booking.room_id == booking.room_id,
        models.Booking.status == "confirmed",
        or_(
            and_(
                models.Booking.start_time < booking.end_time,
                models.Booking.end_time > booking.start_time
            )
        )
    ).first()
    
    if conflicting_booking:
        raise ValueError("Room is already booked for this time period")
    
    db_booking = models.Booking(
        **booking.dict(),
        user_id=user_id
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Add karma points for booking
    update_user_karma(db, user_id, 2)
    
    return db_booking

def get_bookings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Booking).order_by(models.Booking.start_time.desc()).offset(skip).limit(limit).all()

def get_user_bookings(db: Session, user_id: int):
    return db.query(models.Booking).filter(
        models.Booking.user_id == user_id
    ).order_by(models.Booking.start_time.desc()).all()

def get_room_bookings(db: Session, room_id: int, start_date: datetime = None, end_date: datetime = None):
    query = db.query(models.Booking).filter(models.Booking.room_id == room_id)
    
    if start_date:
        query = query.filter(models.Booking.start_time >= start_date)
    if end_date:
        query = query.filter(models.Booking.end_time <= end_date)
    
    return query.order_by(models.Booking.start_time).all()

def get_booking(db: Session, booking_id: int):
    return db.query(models.Booking).filter(models.Booking.id == booking_id).first()

def update_booking(db: Session, booking_id: int, booking_update: schemas.BookingUpdate):
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if db_booking:
        update_data = booking_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_booking, field, value)
        db_booking.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_booking)
    return db_booking

def cancel_booking(db: Session, booking_id: int):
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if db_booking:
        db_booking.status = "cancelled"
        db_booking.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_booking)
    return db_booking

def get_room_availability(db: Session, room_id: int, date: datetime):
    """Get available time slots for a room on a specific date"""
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get all confirmed bookings for the room on this date
    bookings = db.query(models.Booking).filter(
        models.Booking.room_id == room_id,
        models.Booking.status == "confirmed",
        models.Booking.start_time >= start_of_day,
        models.Booking.end_time <= end_of_day
    ).order_by(models.Booking.start_time).all()
    
    # Generate available slots (assuming 1-hour slots from 9 AM to 9 PM)
    available_slots = []
    current_time = start_of_day.replace(hour=9)
    end_time = start_of_day.replace(hour=21)
    
    while current_time < end_time:
        slot_end = current_time + timedelta(hours=1)
        
        # Check if this slot conflicts with any booking
        is_available = True
        for booking in bookings:
            if (current_time < booking.end_time and slot_end > booking.start_time):
                is_available = False
                break
        
        if is_available:
            available_slots.append({
                "start_time": current_time.isoformat(),
                "end_time": slot_end.isoformat(),
                "duration_hours": 1
            })
        
        current_time = slot_end
    
    return available_slots