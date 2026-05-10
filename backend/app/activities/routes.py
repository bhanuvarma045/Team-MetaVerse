from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.activities.models import Activity
from app.stops.models import Stop
from app.trips.models import Trip
from app.auth.utils import get_current_user
from app.auth.models import User
import uuid

router = APIRouter()

# ── Schemas ──────────────────────────────────────────
class ActivityIn(BaseModel):
    name: str
    type: Optional[str] = "sightseeing"
    cost: Optional[float] = 0.0
    duration_hours: Optional[float] = 1.0
    description: Optional[str] = ""
    day: Optional[int] = 1

# ── Helper ────────────────────────────────────────────
async def verify_stop_owner(stop_id: str, user_id, db: AsyncSession):
    result = await db.execute(select(Stop).where(Stop.id == stop_id))
    stop = result.scalar_one_or_none()
    if not stop:
        raise HTTPException(404, "Stop not found")
    trip_result = await db.execute(select(Trip).where(Trip.id == stop.trip_id))
    trip = trip_result.scalar_one_or_none()
    if not trip or str(trip.user_id) != str(user_id):
        raise HTTPException(403, "Access denied")
    return stop

# ── Routes ────────────────────────────────────────────
@router.get("/stops/{stop_id}/activities")
async def get_activities(
    stop_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_stop_owner(stop_id, current_user.id, db)
    result = await db.execute(
        select(Activity).where(Activity.stop_id == stop_id).order_by(Activity.day)
    )
    activities = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "stop_id": str(a.stop_id),
            "name": a.name,
            "type": a.type,
            "cost": a.cost,
            "duration_hours": a.duration_hours,
            "description": a.description,
            "day": a.day,
        }
        for a in activities
    ]


@router.post("/stops/{stop_id}/activities", status_code=201)
async def create_activity(
    stop_id: str,
    body: ActivityIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_stop_owner(stop_id, current_user.id, db)
    activity = Activity(
        id=uuid.uuid4(),
        stop_id=stop_id,
        name=body.name,
        type=body.type,
        cost=body.cost,
        duration_hours=body.duration_hours,
        description=body.description,
        day=body.day,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return {"id": str(activity.id), "message": "Activity added"}


@router.put("/activities/{activity_id}")
async def update_activity(
    activity_id: str,
    body: ActivityIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(404, "Activity not found")
    await verify_stop_owner(str(activity.stop_id), current_user.id, db)

    activity.name           = body.name
    activity.type           = body.type
    activity.cost           = body.cost
    activity.duration_hours = body.duration_hours
    activity.description    = body.description
    activity.day            = body.day

    await db.commit()
    return {"message": "Activity updated"}


@router.delete("/activities/{activity_id}")
async def delete_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(404, "Activity not found")
    await verify_stop_owner(str(activity.stop_id), current_user.id, db)

    await db.delete(activity)
    await db.commit()
    return {"message": "Activity deleted"}