from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.auth.utils import get_current_user
from app.auth.models import User
from app.budget.routes import CityRate
from sqlalchemy import Column, String, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid

router = APIRouter()


# ── Activity Catalog Table ────────────────────────────
class ActivityCatalog(Base):
    __tablename__ = "activity_catalog"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String(200), nullable=False)
    city        = Column(String(100), nullable=False, index=True)
    country     = Column(String(100), nullable=False)
    type        = Column(String(50), default="sightseeing")
    cost        = Column(Float, default=0.0)
    duration_hours = Column(Float, default=1.0)
    description = Column(Text, default="")


# ── City Search ───────────────────────────────────────
@router.get("/search/cities")
async def search_cities(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(CityRate).where(
            CityRate.city.ilike(f"%{q}%")
        )
    )
    cities = result.scalars().all()
    if not cities:
        raise HTTPException(404, "No cities found")
    return [
        {
            "city":      c.city,
            "country":   c.country,
            "hotel_per_day":     c.hotel,
            "food_per_day":      c.food,
            "transport_per_day": c.transport,
        }
        for c in cities
    ]


# ── Activity Search ───────────────────────────────────
@router.get("/search/activities")
async def search_activities(
    city: str = Query(..., min_length=1),
    type: str = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ActivityCatalog).where(
        ActivityCatalog.city.ilike(f"%{city}%")
    )
    if type:
        query = query.where(ActivityCatalog.type == type)

    result = await db.execute(query)
    activities = result.scalars().all()
    return [
        {
            "id":             str(a.id),
            "name":           a.name,
            "city":           a.city,
            "country":        a.country,
            "type":           a.type,
            "cost":           a.cost,
            "duration_hours": a.duration_hours,
            "description":    a.description,
        }
        for a in activities
    ]