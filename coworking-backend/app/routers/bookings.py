from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from .. import crud, schemas
from ..utils.security import get_current_user
from ..utils.permissions import (
    Permission, has_permission, check_booking_access,
    validate_booking_limits, validate_booking_time, can_cancel_booking
)

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("/", response_model=schemas.BookingResponse)
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Create a new booking"""
    # Check permissions
    if not has_permission(current_user, Permission.CREATE_BOOKINGS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission 'bookings:create' required"
        )
    
    # Validate booking time constraints
    if not validate_booking_time(booking):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking time. Check time constraints."
        )
    
    # Check booking limits
    if not validate_booking_limits(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum number of active bookings reached (3)"
        )
    
    # Check if room exists
    room = crud.get_room(db=db, room_id=booking.room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    if not room.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is not available for booking"
        )
    
    try:
        db_booking = crud.create_booking(db=db, booking=booking, user_id=current_user.id)
        
        # Create response with user and room info
        booking_dict = db_booking.__dict__.copy()
        booking_dict['user_name'] = current_user.full_name
        booking_dict['room'] = room
        
        return schemas.BookingResponse(**booking_dict)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[schemas.BookingResponse])
def get_bookings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Get all bookings (admin only) or user's own bookings"""
    if current_user.is_admin:
        bookings = crud.get_bookings(db=db, skip=skip, limit=limit)
    else:
        bookings = crud.get_user_bookings(db=db, user_id=current_user.id)
    
    # Add user names to booking responses
    booking_responses = []
    for booking in bookings:
        booking_dict = booking.__dict__.copy()
        booking_dict['user_name'] = booking.user.full_name if booking.user else None
        booking_dict['room'] = booking.room
        booking_responses.append(schemas.BookingResponse(**booking_dict))
    
    return booking_responses

@router.get("/my", response_model=List[schemas.BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Get current user's bookings"""
    bookings = crud.get_user_bookings(db=db, user_id=current_user.id)
    
    # Add user names to booking responses
    booking_responses = []
    for booking in bookings:
        booking_dict = booking.__dict__.copy()
        booking_dict['user_name'] = current_user.full_name
        booking_dict['room'] = booking.room
        booking_responses.append(schemas.BookingResponse(**booking_dict))
    
    return booking_responses

@router.get("/{booking_id}", response_model=schemas.BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Get booking by ID"""
    booking = crud.get_booking(db=db, booking_id=booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if user can access this booking
    if not current_user.is_admin and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this booking"
        )
    
    # Create response with user and room info
    booking_dict = booking.__dict__.copy()
    booking_dict['user_name'] = booking.user.full_name if booking.user else None
    booking_dict['room'] = booking.room
    
    return schemas.BookingResponse(**booking_dict)

@router.put("/{booking_id}", response_model=schemas.BookingResponse)
def update_booking(
    booking_id: int,
    booking_update: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Update booking"""
    booking = crud.get_booking(db=db, booking_id=booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if user can update this booking
    if not current_user.is_admin and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this booking"
        )
    
    # Check if booking can be modified (not in the past)
    if booking.start_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify past bookings"
        )
    
    try:
        updated_booking = crud.update_booking(
            db=db, 
            booking_id=booking_id, 
            booking_update=booking_update
        )
        
        # Create response with user and room info
        booking_dict = updated_booking.__dict__.copy()
        booking_dict['user_name'] = updated_booking.user.full_name if updated_booking.user else None
        booking_dict['room'] = updated_booking.room
        
        return schemas.BookingResponse(**booking_dict)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{booking_id}", response_model=schemas.BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """Cancel booking"""
    booking = crud.get_booking(db=db, booking_id=booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if user can cancel this booking
    if not current_user.is_admin and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to cancel this booking"
        )
    
    # Check if booking can be cancelled (not in the past)
    if booking.start_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel past bookings"
        )
    
    cancelled_booking = crud.cancel_booking(db=db, booking_id=booking_id)
    
    # Create response with user and room info
    booking_dict = cancelled_booking.__dict__.copy()
    booking_dict['user_name'] = cancelled_booking.user.full_name if cancelled_booking.user else None
    booking_dict['room'] = cancelled_booking.room
    
    return schemas.BookingResponse(**booking_dict)
