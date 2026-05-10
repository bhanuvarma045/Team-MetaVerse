from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth.models import User
from app.auth.utils import get_current_user

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: str
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None

@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "city": current_user.city,
        "country": current_user.country,
        "phone": current_user.phone,
        "bio": current_user.bio,
        "photo_url": current_user.photo_url,
        "created_at": str(current_user.created_at),
    }

@router.put("/profile")
async def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.name      = body.name
    current_user.city      = body.city
    current_user.country   = body.country
    current_user.phone     = body.phone
    current_user.bio       = body.bio
    current_user.photo_url = body.photo_url
    await db.commit()
    await db.refresh(current_user)
    return {"message": "Profile updated"}