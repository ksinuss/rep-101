from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    karma = Column(Integer, default=0)
    total_donated = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    visits = relationship("Visit", back_populates="user")
    donations = relationship("Donation", back_populates="user")

class Visit(Base):
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    check_in = Column(DateTime, default=datetime.utcnow)
    check_out = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    
    user = relationship("User", back_populates="visits")

class Donation(Base):
    __tablename__ = "donations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    donation_date = Column(DateTime, default=datetime.utcnow)
    message = Column(String, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="donations")