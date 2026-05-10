from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid

class Note(Base):
    __tablename__ = "notes"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id    = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    title      = Column(String(200), default="")
    content    = Column(Text, nullable=False)
    day        = Column(String(20), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    trip       = relationship("Trip", back_populates="notes")