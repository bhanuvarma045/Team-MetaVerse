from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100), nullable=False)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    city          = Column(String(100), nullable=True)
    country       = Column(String(100), nullable=True)
    phone         = Column(String(20),  nullable=True)
    photo_url     = Column(Text,        nullable=True)
    bio           = Column(Text,        nullable=True)
    created_at    = Column(DateTime,    default=datetime.utcnow)