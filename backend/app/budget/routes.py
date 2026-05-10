from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Column, String, Float
from sqlalchemy.dialects.postgresql import UUID
from app.database import get_db, Base
from app.trips.models import Trip
from app.stops.models import Stop
from app.activities.models import Activity
from app.auth.utils import get_current_user
from app.auth.models import User
import uuid

router = APIRouter()


# ── City Cost Table ───────────────────────────────────
class CityRate(Base):
    __tablename__ = "city_rates"

    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city      = Column(String(100), unique=True, nullable=False, index=True)
    country   = Column(String(100), nullable=False)
    hotel     = Column(Float, default=5000.0)
    food      = Column(Float, default=1500.0)
    transport = Column(Float, default=1000.0)


# ── Helper ────────────────────────────────────────────
def days_between(start: str, end: str) -> int:
    from datetime import datetime
    try:
        d1 = datetime.strptime(start, "%Y-%m-%d")
        d2 = datetime.strptime(end, "%Y-%m-%d")
        return max((d2 - d1).days, 1)
    except Exception:
        return 1


async def get_city_rate(city: str, db: AsyncSession) -> dict:
    result = await db.execute(
        select(CityRate).where(CityRate.city == city.lower())
    )
    rate = result.scalar_one_or_none()
    if rate:
        return {"hotel": rate.hotel, "food": rate.food, "transport": rate.transport}
    # fallback — query default row from DB
    fallback = await db.execute(select(CityRate).where(CityRate.city == "default"))
    f = fallback.scalar_one_or_none()
    if f:
        return {"hotel": f.hotel, "food": f.food, "transport": f.transport}
    return {"hotel": 5000.0, "food": 1500.0, "transport": 1000.0}


# ── Route ─────────────────────────────────────────────
@router.get("/trips/{trip_id}/budget")
async def get_budget(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip_result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    stops_result = await db.execute(select(Stop).where(Stop.trip_id == trip_id))
    stops = stops_result.scalars().all()

    total_hotel      = 0.0
    total_food       = 0.0
    total_transport  = 0.0
    total_activities = 0.0
    total_days       = 0
    per_stop_breakdown = []

    for stop in stops:
        days  = days_between(stop.start_date, stop.end_date)
        total_days += days
        costs = await get_city_rate(stop.city, db)

        stop_hotel     = costs["hotel"]     * days
        stop_food      = costs["food"]      * days
        stop_transport = costs["transport"] * days

        act_result = await db.execute(
            select(Activity).where(Activity.stop_id == stop.id)
        )
        activities = act_result.scalars().all()
        stop_activities = sum(a.cost for a in activities)

        total_hotel      += stop_hotel
        total_food       += stop_food
        total_transport  += stop_transport
        total_activities += stop_activities

        per_stop_breakdown.append({
            "stop_id":    str(stop.id),
            "city":       stop.city,
            "country":    stop.country,
            "days":       days,
            "hotel":      stop_hotel,
            "food":       stop_food,
            "transport":  stop_transport,
            "activities": stop_activities,
            "subtotal":   round(stop_hotel + stop_food + stop_transport + stop_activities, 2),
        })

    grand_total = total_hotel + total_food + total_transport + total_activities

    return {
        "trip_id":       trip_id,
        "trip_name":     trip.name,
        "total_days":    total_days,
        "grand_total":   round(grand_total, 2),
        "per_day_average": round(grand_total / total_days, 2) if total_days else 0,
        "breakdown": {
            "hotel":      round(total_hotel, 2),
            "food":       round(total_food, 2),
            "transport":  round(total_transport, 2),
            "activities": round(total_activities, 2),
        },
        "per_stop":  per_stop_breakdown,
        "currency":  "INR",
    }