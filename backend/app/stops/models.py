from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid

class Stop(Base):
    __tablename__ = "stops"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id    = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    city       = Column(String(100), nullable=False)
    country    = Column(String(100), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date   = Column(String(20), nullable=False)
    budget     = Column(Float, default=0.0)
    notes      = Column(String(500), default="")
    order      = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip       = relationship("Trip", back_populates="stops")