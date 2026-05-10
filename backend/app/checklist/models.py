from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id    = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    item       = Column(String(200), nullable=False)
    category   = Column(String(50), default="other")
    is_checked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip       = relationship("Trip", back_populates="checklist")