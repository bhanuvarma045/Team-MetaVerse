from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db
from app.trips.models import Trip
from app.stops.models import Stop
from app.auth.models import User
from app.auth.utils import get_current_user

router = APIRouter()


@router.get("/community")
async def get_public_trips(
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Trip).where(Trip.is_public == True)
    result = await db.execute(query)
    trips = result.scalars().all()

    output = []
    for t in trips:
        # get owner name
        user_result = await db.execute(select(User).where(User.id == t.user_id))
        user = user_result.scalar_one_or_none()

        # get stops count + cities
        stops_result = await db.execute(select(Stop).where(Stop.trip_id == t.id))
        stops = stops_result.scalars().all()
        cities = [s.city for s in stops]

        trip_data = {
            "id":          str(t.id),
            "name":        t.name,
            "description": t.description,
            "start_date":  t.start_date,
            "end_date":    t.end_date,
            "share_token": t.share_token,
            "owner":       user.name if user else "Unknown",
            "cities":      cities,
            "stop_count":  len(stops),
            "created_at":  str(t.created_at),
        }

        # apply search filter
        if search:
            keyword = search.lower()
            if (
                keyword in t.name.lower()
                or keyword in t.description.lower()
                or any(keyword in c.lower() for c in cities)
            ):
                output.append(trip_data)
        else:
            output.append(trip_data)

    return output


@router.get("/community/{share_token}")
async def get_public_trip_by_token(
    share_token: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Trip).where(
            Trip.share_token == share_token,
            Trip.is_public == True
        )
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found or not public")

    user_result = await db.execute(select(User).where(User.id == trip.user_id))
    user = user_result.scalar_one_or_none()

    stops_result = await db.execute(select(Stop).where(Stop.trip_id == trip.id))
    stops = stops_result.scalars().all()

    return {
        "id":          str(trip.id),
        "name":        trip.name,
        "description": trip.description,
        "start_date":  trip.start_date,
        "end_date":    trip.end_date,
        "owner":       user.name if user else "Unknown",
        "stops": [
            {
                "city":       s.city,
                "country":    s.country,
                "start_date": s.start_date,
                "end_date":   s.end_date,
            }
            for s in stops
        ],
    }