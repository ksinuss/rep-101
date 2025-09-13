from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..utils.security import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.DonationResponse)
def create_donation(donation: schemas.DonationCreate, db: Session = Depends(get_db),
                   current_user: schemas.UserResponse = Depends(get_current_user)):
    if current_user.id != donation.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_donation(db=db, donation=donation)

@router.get("/", response_model=list[schemas.DonationResponse])
def get_all_donations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                     current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.get_donations(db, skip=skip, limit=limit)

@router.get("/recent", response_model=list[schemas.DonationResponse])
def get_recent_donations(limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_recent_donations(db, limit=limit)

@router.get("/stats")
def get_donations_stats(days: int = 30, db: Session = Depends(get_db),
                       current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.get_donations_stats(db, days=days)
