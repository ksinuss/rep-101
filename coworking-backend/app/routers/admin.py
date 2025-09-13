from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from ..database import get_db
from .. import models, schemas
from ..utils.security import get_current_user

router = APIRouter()

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db),
                       current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Общая статистика
    total_users = db.query(func.count(models.User.id)).scalar()
    
    # Активные пользователи сегодня
    today = datetime.now().date()
    active_users_today = db.query(func.count(models.Visit.user_id.distinct())).filter(
        func.date(models.Visit.check_in) == today
    ).scalar()
    
    total_visits = db.query(func.count(models.Visit.id)).scalar()
    
    total_donations = db.query(func.coalesce(func.sum(models.Donation.amount), 0)).scalar() or 0
    
    # Средняя продолжительность посещения
    avg_duration = db.query(func.avg(models.Visit.duration_minutes)).filter(
        models.Visit.duration_minutes > 0
    ).scalar() or 0
    
    # DAU за последние 30 дней
    daily_active_users = {}
    for i in range(30):
        day = today - timedelta(days=i)
        dau = db.query(func.count(models.Visit.user_id.distinct())).filter(
            func.date(models.Visit.check_in) == day
        ).scalar() or 0
        daily_active_users[day.isoformat()] = dau
    
    # MAU за последние 12 месяцев
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
    
    return {
        "total_users": total_users,
        "active_users_today": active_users_today,
        "total_visits": total_visits,
        "total_donations": float(total_donations),
        "average_visit_duration": float(avg_duration),
        "daily_active_users": daily_active_users,
        "monthly_active_users": monthly_active_users
    }

@router.get("/users/{user_id}/stats", response_model=schemas.UserStats)
def get_user_stats(user_id: int, db: Session = Depends(get_db),
                  current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_visits = db.query(func.count(models.Visit.id)).filter(
        models.Visit.user_id == user_id
    ).scalar()
    
    total_donation = db.query(func.coalesce(func.sum(models.Donation.amount), 0)).filter(
        models.Donation.user_id == user_id
    ).scalar() or 0
    
    avg_duration = db.query(func.avg(models.Visit.duration_minutes)).filter(
        models.Visit.user_id == user_id,
        models.Visit.duration_minutes > 0
    ).scalar() or 0
    
    return {
        "user": user,
        "total_visits": total_visits,
        "total_donation": float(total_donation),
        "average_duration": float(avg_duration)
    }

@router.get("/users/", response_model=list[schemas.UserResponse])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                 current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return db.query(models.User).offset(skip).limit(limit).all()

@router.get("/visits/", response_model=list[schemas.VisitResponse])
def get_all_visits(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                  current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return db.query(models.Visit).offset(skip).limit(limit).all()

@router.get("/donations/", response_model=list[schemas.DonationResponse])
def get_all_donations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                     current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return db.query(models.Donation).offset(skip).limit(limit).all()