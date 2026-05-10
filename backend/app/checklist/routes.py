from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.checklist.models import ChecklistItem
from app.trips.models import Trip
from app.auth.utils import get_current_user
from app.auth.models import User
import uuid

router = APIRouter()

class ChecklistIn(BaseModel):
    item: str
    category: Optional[str] = "other"

class ChecklistToggle(BaseModel):
    is_checked: bool

async def verify_trip_owner(trip_id: str, user_id, db: AsyncSession):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(user_id):
        raise HTTPException(403, "Access denied")
    return trip


@router.get("/trips/{trip_id}/checklist")
async def get_checklist(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_trip_owner(trip_id, current_user.id, db)
    result = await db.execute(
        select(ChecklistItem)
        .where(ChecklistItem.trip_id == trip_id)
        .order_by(ChecklistItem.category, ChecklistItem.created_at)
    )
    items = result.scalars().all()
    return [
        {
            "id":         str(i.id),
            "trip_id":    str(i.trip_id),
            "item":       i.item,
            "category":   i.category,
            "is_checked": i.is_checked,
        }
        for i in items
    ]


@router.post("/trips/{trip_id}/checklist", status_code=201)
async def add_item(
    trip_id: str,
    body: ChecklistIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_trip_owner(trip_id, current_user.id, db)
    item = ChecklistItem(
        id=uuid.uuid4(),
        trip_id=trip_id,
        item=body.item,
        category=body.category,
        is_checked=False,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": str(item.id), "message": "Item added"}


@router.patch("/checklist/{item_id}")
async def toggle_item(
    item_id: str,
    body: ChecklistToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ChecklistItem).where(ChecklistItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    await verify_trip_owner(str(item.trip_id), current_user.id, db)
    item.is_checked = body.is_checked
    await db.commit()
    return {"message": "Updated", "is_checked": item.is_checked}


@router.delete("/checklist/{item_id}")
async def delete_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ChecklistItem).where(ChecklistItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    await verify_trip_owner(str(item.trip_id), current_user.id, db)
    await db.delete(item)
    await db.commit()
    return {"message": "Item deleted"}