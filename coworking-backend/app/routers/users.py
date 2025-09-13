from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..utils.security import get_current_user

router = APIRouter()

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: schemas.UserResponse = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), 
            current_user: schemas.UserResponse = Depends(get_current_user)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/{user_id}/visits", response_model=list[schemas.VisitResponse])
def get_user_visits(user_id: int, db: Session = Depends(get_db),
                   current_user: schemas.UserResponse = Depends(get_current_user)):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_user_visits(db, user_id=user_id)

@router.get("/{user_id}/donations", response_model=list[schemas.DonationResponse])
def get_user_donations(user_id: int, db: Session = Depends(get_db),
                      current_user: schemas.UserResponse = Depends(get_current_user)):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_user_donations(db, user_id=user_id)