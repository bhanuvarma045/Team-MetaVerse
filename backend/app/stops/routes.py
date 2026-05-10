from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.stops.models import Stop
from app.trips.models import Trip
from app.auth.utils import get_current_user
from app.auth.models import User
import uuid

router = APIRouter()

# ── Schemas ──────────────────────────────────────────
class StopIn(BaseModel):
    city: str
    country: str
    start_date: str
    end_date: str
    budget: Optional[float] = 0.0
    notes: Optional[str] = ""
    order: Optional[int] = 0

# ── Helper ────────────────────────────────────────────
async def verify_trip_owner(trip_id: str, user_id, db: AsyncSession):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(user_id):
        raise HTTPException(403, "Access denied")
    return trip

# ── Routes ────────────────────────────────────────────
@router.get("/trips/{trip_id}/stops")
async def get_stops(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_trip_owner(trip_id, current_user.id, db)
    result = await db.execute(
        select(Stop).where(Stop.trip_id == trip_id).order_by(Stop.order)
    )
    stops = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "trip_id": str(s.trip_id),
            "city": s.city,
            "country": s.country,
            "start_date": s.start_date,
            "end_date": s.end_date,
            "budget": s.budget,
            "notes": s.notes,
            "order": s.order,
        }
        for s in stops
    ]


@router.post("/trips/{trip_id}/stops", status_code=201)
async def create_stop(
    trip_id: str,
    body: StopIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_trip_owner(trip_id, current_user.id, db)
    stop = Stop(
        id=uuid.uuid4(),
        trip_id=trip_id,
        city=body.city,
        country=body.country,
        start_date=body.start_date,
        end_date=body.end_date,
        budget=body.budget,
        notes=body.notes,
        order=body.order,
    )
    db.add(stop)
    await db.commit()
    await db.refresh(stop)
    return {"id": str(stop.id), "message": "Stop added"}


@router.put("/stops/{stop_id}")
async def update_stop(
    stop_id: str,
    body: StopIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Stop).where(Stop.id == stop_id))
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(404, "Stop not found")
    await verify_trip_owner(str(stop.trip_id), current_user.id, db)

    stop.city       = body.city
    stop.country    = body.country
    stop.start_date = body.start_date
    stop.end_date   = body.end_date
    stop.budget     = body.budget
    stop.notes      = body.notes
    stop.order      = body.order

    await db.commit()
    return {"message": "Stop updated"}


@router.delete("/stops/{stop_id}")
async def delete_stop(
    stop_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Stop).where(Stop.id == stop_id))
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(404, "Stop not found")
    await verify_trip_owner(str(stop.trip_id), current_user.id, db)

    await db.delete(stop)
    await db.commit()
    return {"message": "Stop deleted"}