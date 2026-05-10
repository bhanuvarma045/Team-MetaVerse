from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.notes.models import Note
from app.trips.models import Trip
from app.auth.utils import get_current_user
from app.auth.models import User
import uuid

router = APIRouter()

class NoteIn(BaseModel):
    title:   Optional[str] = ""
    content: str
    day:     Optional[str] = ""

async def verify_trip_owner(trip_id: str, user_id, db: AsyncSession):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(404, "Trip not found")
    if str(trip.user_id) != str(user_id):
        raise HTTPException(403, "Access denied")
    return trip


@router.get("/trips/{trip_id}/notes")
async def get_notes(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_trip_owner(trip_id, current_user.id, db)
    result = await db.execute(
        select(Note)
        .where(Note.trip_id == trip_id)
        .order_by(Note.created_at.desc())
    )
    notes = result.scalars().all()
    return [
        {
            "id":         str(n.id),
            "trip_id":    str(n.trip_id),
            "title":      n.title,
            "content":    n.content,
            "day":        n.day,
            "created_at": str(n.created_at),
        }
        for n in notes
    ]


@router.post("/trips/{trip_id}/notes", status_code=201)
async def create_note(
    trip_id: str,
    body: NoteIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_trip_owner(trip_id, current_user.id, db)
    note = Note(
        id=uuid.uuid4(),
        trip_id=trip_id,
        title=body.title,
        content=body.content,
        day=body.day,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return {"id": str(note.id), "message": "Note created"}


@router.put("/notes/{note_id}")
async def update_note(
    note_id: str,
    body: NoteIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(404, "Note not found")
    await verify_trip_owner(str(note.trip_id), current_user.id, db)
    note.title   = body.title
    note.content = body.content
    note.day     = body.day
    await db.commit()
    return {"message": "Note updated"}


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(404, "Note not found")
    await verify_trip_owner(str(note.trip_id), current_user.id, db)
    await db.delete(note)
    await db.commit()
    return {"message": "Note deleted"}