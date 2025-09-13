from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from .. import crud, schemas
from ..utils.security import get_current_user
from ..utils.permissions import (
    Permission, has_permission, check_room_access, 
    is_admin, require_permission
)

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("/", response_model=schemas.RoomResponse)
def create_room(
    room: schemas.RoomCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Create a new room (admin only)"""
    if not has_permission(current_user, Permission.CREATE_ROOMS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission 'rooms:create' required"
        )
    
    # Check if room name already exists
    existing_room = crud.get_room_by_name(db, room.name)
    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room with this name already exists"
        )
    
    return crud.create_room(db=db, room=room)

@router.get("/", response_model=List[schemas.RoomResponse])
def get_rooms(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Get list of rooms"""
    if not has_permission(current_user, Permission.VIEW_ROOMS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission 'rooms:view' required"
        )
    return crud.get_rooms(db=db, skip=skip, limit=limit, active_only=active_only)

@router.get("/{room_id}", response_model=schemas.RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    """Get room by ID"""
    room = crud.get_room(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return room

@router.put("/{room_id}", response_model=schemas.RoomResponse)
def update_room(
    room_id: int,
    room_update: schemas.RoomUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Update room (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update rooms"
        )
    
    room = crud.update_room(db=db, room_id=room_id, room_update=room_update)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return room

@router.delete("/{room_id}", response_model=schemas.RoomResponse)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Delete room (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete rooms"
        )
    
    room = crud.delete_room(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return room

@router.get("/{room_id}/availability")
def get_room_availability(
    room_id: int,
    date: datetime,
    db: Session = Depends(get_db)
):
    """Get available time slots for a room on a specific date"""
    room = crud.get_room(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    available_slots = crud.get_room_availability(db=db, room_id=room_id, date=date)
    
    return {
        "room_id": room_id,
        "room_name": room.name,
        "date": date.isoformat(),
        "available_slots": available_slots
    }

@router.get("/{room_id}/bookings", response_model=List[schemas.BookingResponse])
def get_room_bookings(
    room_id: int,
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(get_db)
):
    """Get bookings for a specific room"""
    room = crud.get_room(db=db, room_id=room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    bookings = crud.get_room_bookings(
        db=db, 
        room_id=room_id, 
        start_date=start_date, 
        end_date=end_date
    )
    
    # Add user names to booking responses
    booking_responses = []
    for booking in bookings:
        booking_dict = booking.__dict__.copy()
        booking_dict['user_name'] = booking.user.full_name if booking.user else None
        booking_dict['room'] = booking.room
        booking_responses.append(schemas.BookingResponse(**booking_dict))
    
    return booking_responses
