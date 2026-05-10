from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from datetime import datetime
import uuid

class Activity(Base):
    __tablename__ = "activities"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stop_id        = Column(UUID(as_uuid=True), ForeignKey("stops.id", ondelete="CASCADE"), nullable=False)
    name           = Column(String(200), nullable=False)
    type           = Column(String(50), default="sightseeing")
    cost           = Column(Float, default=0.0)
    duration_hours = Column(Float, default=1.0)
    description    = Column(String(500), default="")
    day            = Column(Integer, default=1)
    created_at     = Column(DateTime, default=datetime.utcnow)