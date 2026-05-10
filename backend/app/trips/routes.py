from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.trips.models import Trip
from app.auth.utils import get_current_user
from app.auth.models import User
from datetime import datetime
import uuid, secrets

router = APIRouter()

# ── Schemas ──────────────────────────────────────────
class TripIn(BaseModel):
    name: str
    description: Optional[str] = ""
    start_date: str
    end_date: str
    is_public: Optional[bool] = False

class TripOut(BaseModel):
    id: str
    name: str
    description: str
    start_date: str
    end_date: str
    is_public: bool
    share_token: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

# ── Routes ────────────────────────────────────────────
@router.get("/trips")
async def get_trips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Trip).where(Trip.user_id == current_user.id).order_by(Trip.created_at.desc())
    )
    trips = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "description": t.description,
            "start_date": t.start_date,
            "end_date": t.end_date,
            "is_public": t.is_public,
            "share_token": t.share_token,
            "created_at": str(t.created_at),
        }
        for t in trips
    ]


@router.post("/trips", status_code=201)
async def create_trip(
    body: TripIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = Trip(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        start_date=body.start_date,
        end_date=body.end_date,
        is_public=body.is_public,
        share_token=secrets.token_urlsafe(16) if body.is_public else None,
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return {"id": str(trip.id), "message": "Trip created"}


@router.get("/trips/{trip_id}")
async def get_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")
    return {
        "id": str(trip.id),
        "name": trip.name,
        "description": trip.description,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "is_public": trip.is_public,
        "share_token": trip.share_token,
        "created_at": str(trip.created_at),
    }


@router.put("/trips/{trip_id}")
async def update_trip(
    trip_id: str,
    body: TripIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    trip.name        = body.name
    trip.description = body.description
    trip.start_date  = body.start_date
    trip.end_date    = body.end_date
    trip.is_public   = body.is_public
    if body.is_public and not trip.share_token:
        trip.share_token = secrets.token_urlsafe(16)

    await db.commit()
    return {"message": "Trip updated"}


@router.delete("/trips/{trip_id}")
async def delete_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    await db.delete(trip)
    await db.commit()
    return {"message": "Trip deleted"}


@router.patch("/trips/{trip_id}/share")
async def toggle_share(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    trip.is_public = not trip.is_public
    if trip.is_public and not trip.share_token:
        trip.share_token = secrets.token_urlsafe(16)

    await db.commit()
    return {"is_public": trip.is_public, "share_token": trip.share_token}