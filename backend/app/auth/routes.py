from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.auth.models import User
from app.auth.utils import hash_password, verify_password, create_token, get_current_user
import uuid

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    city: str | None = None
    country: str | None = None
    phone: str | None = None
    bio: str | None = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    city: str | None
    country: str | None
    phone: str | None
    photo_url: str | None
    bio: str | None

    class Config:
        from_attributes = True

# ── Routes ───────────────────────────────────────────────────────
@router.post("/register", status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        id            = uuid.uuid4(),
        name          = body.name,
        email         = body.email,
        password_hash = hash_password(body.password),
        city          = body.city,
        country       = body.country,
        phone         = body.phone,
        bio           = body.bio,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "Account created", "id": str(user.id)}


@router.post("/login")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_token({"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me")
async def update_profile(
    body: RegisterIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.name    = body.name
    current_user.city    = body.city
    current_user.country = body.country
    current_user.phone   = body.phone
    current_user.bio     = body.bio
    await db.commit()
    await db.refresh(current_user)
    return {"message": "Profile updated"}