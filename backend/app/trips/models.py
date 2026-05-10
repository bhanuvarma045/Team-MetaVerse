from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid

class Trip(Base):
    __tablename__ = "trips"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name        = Column(String(200), nullable=False)
    description = Column(Text, default="")
    start_date  = Column(String(20), nullable=False)
    end_date    = Column(String(20), nullable=False)
    is_public   = Column(Boolean, default=False)
    share_token = Column(String(100), unique=True, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    stops       = relationship("Stop", back_populates="trip", cascade="all, delete")
    notes       = relationship("Note", back_populates="trip", cascade="all, delete")
    checklist   = relationship("ChecklistItem", back_populates="trip", cascade="all, delete")