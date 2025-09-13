from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..utils.security import get_current_user

router = APIRouter()

@router.post("/check-in", response_model=schemas.VisitResponse)
def check_in(visit: schemas.VisitCreate, db: Session = Depends(get_db),
            current_user: schemas.UserResponse = Depends(get_current_user)):
    if current_user.id != visit.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_visit(db=db, visit=visit)

@router.post("/{visit_id}/check-out", response_model=schemas.VisitResponse)
def check_out(visit_id: int, db: Session = Depends(get_db),
             current_user: schemas.UserResponse = Depends(get_current_user)):
    visit = crud.check_out_visit(db, visit_id=visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    if current_user.id != visit.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return visit

@router.post("/donate", response_model=schemas.DonationResponse)
def make_donation(donation: schemas.DonationCreate, db: Session = Depends(get_db),
                 current_user: schemas.UserResponse = Depends(get_current_user)):
    if current_user.id != donation.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    if donation.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum donation amount is 10 rubles")
    return crud.create_donation(db=db, donation=donation)

@router.get("/donations", response_model=list[schemas.DonationResponse])
def get_all_donations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                     current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.get_donations(db, skip=skip, limit=limit)

@router.get("/donations/recent", response_model=list[schemas.DonationResponse])
def get_recent_donations(limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_recent_donations(db, limit=limit)

@router.get("/donations/stats")
def get_donations_stats(days: int = 30, db: Session = Depends(get_db),
                       current_user: schemas.UserResponse = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.get_donations_stats(db, days=days)