import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from dotenv import load_dotenv
from passlib.context import CryptContext
import os, uuid

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

from app.database import Base
from app.auth.models import User
from app.trips.models import Trip
from app.stops.models import Stop
from app.notes.models import Note
from app.checklist.models import ChecklistItem
from app.activities.models import Activity
from app.budget.routes import CityRate
from app.search.routes import ActivityCatalog

CITIES = [
    {"city": "paris",      "country": "France",      "hotel": 8000,  "food": 2500, "transport": 1500},
    {"city": "london",     "country": "UK",           "hotel": 9000,  "food": 3000, "transport": 2000},
    {"city": "tokyo",      "country": "Japan",        "hotel": 7000,  "food": 2000, "transport": 1800},
    {"city": "dubai",      "country": "UAE",          "hotel": 10000, "food": 3500, "transport": 2500},
    {"city": "bangkok",    "country": "Thailand",     "hotel": 3000,  "food": 800,  "transport": 600},
    {"city": "singapore",  "country": "Singapore",    "hotel": 8500,  "food": 2800, "transport": 1200},
    {"city": "rome",       "country": "Italy",        "hotel": 7000,  "food": 2200, "transport": 1000},
    {"city": "new york",   "country": "USA",          "hotel": 12000, "food": 4000, "transport": 3000},
    {"city": "bali",       "country": "Indonesia",    "hotel": 2500,  "food": 700,  "transport": 500},
    {"city": "istanbul",   "country": "Turkey",       "hotel": 4000,  "food": 1200, "transport": 800},
    {"city": "mumbai",     "country": "India",        "hotel": 4500,  "food": 1000, "transport": 700},
    {"city": "delhi",      "country": "India",        "hotel": 4000,  "food": 900,  "transport": 600},
    {"city": "goa",        "country": "India",        "hotel": 3500,  "food": 800,  "transport": 500},
    {"city": "barcelona",  "country": "Spain",        "hotel": 7500,  "food": 2300, "transport": 1100},
    {"city": "amsterdam",  "country": "Netherlands",  "hotel": 8000,  "food": 2600, "transport": 1300},
    {"city": "sydney",     "country": "Australia",    "hotel": 9500,  "food": 3200, "transport": 2200},
    {"city": "cairo",      "country": "Egypt",        "hotel": 3000,  "food": 900,  "transport": 700},
    {"city": "prague",     "country": "Czech Rep",    "hotel": 5000,  "food": 1400, "transport": 900},
    {"city": "vienna",     "country": "Austria",      "hotel": 7000,  "food": 2100, "transport": 1200},
    {"city": "seoul",      "country": "South Korea",  "hotel": 6000,  "food": 1800, "transport": 1000},
    {"city": "default",    "country": "Global",       "hotel": 5000,  "food": 1500, "transport": 1000},
]

ACTIVITIES = [
    {"name": "Eiffel Tower Visit",         "city": "paris",     "country": "France",      "type": "sightseeing", "cost": 800,  "duration_hours": 3.0},
    {"name": "Seine River Cruise",         "city": "paris",     "country": "France",      "type": "sightseeing", "cost": 1200, "duration_hours": 2.0},
    {"name": "Louvre Museum",              "city": "paris",     "country": "France",      "type": "sightseeing", "cost": 1000, "duration_hours": 4.0},
    {"name": "Paris Food Tour",            "city": "paris",     "country": "France",      "type": "food",        "cost": 2500, "duration_hours": 3.0},
    {"name": "Big Ben & Westminster",      "city": "london",    "country": "UK",          "type": "sightseeing", "cost": 0,    "duration_hours": 2.0},
    {"name": "British Museum",             "city": "london",    "country": "UK",          "type": "sightseeing", "cost": 0,    "duration_hours": 3.0},
    {"name": "London Eye",                 "city": "london",    "country": "UK",          "type": "sightseeing", "cost": 2500, "duration_hours": 1.0},
    {"name": "Tower of London",            "city": "london",    "country": "UK",          "type": "sightseeing", "cost": 3000, "duration_hours": 3.0},
    {"name": "Mount Fuji Day Trip",        "city": "tokyo",     "country": "Japan",       "type": "adventure",   "cost": 4000, "duration_hours": 10.0},
    {"name": "Tsukiji Food Tour",          "city": "tokyo",     "country": "Japan",       "type": "food",        "cost": 2000, "duration_hours": 3.0},
    {"name": "Shibuya Crossing Walk",      "city": "tokyo",     "country": "Japan",       "type": "sightseeing", "cost": 0,    "duration_hours": 1.0},
    {"name": "Burj Khalifa Observation",   "city": "dubai",     "country": "UAE",         "type": "sightseeing", "cost": 5000, "duration_hours": 2.0},
    {"name": "Desert Safari",              "city": "dubai",     "country": "UAE",         "type": "adventure",   "cost": 4500, "duration_hours": 6.0},
    {"name": "Dubai Mall & Fountain",      "city": "dubai",     "country": "UAE",         "type": "sightseeing", "cost": 0,    "duration_hours": 3.0},
    {"name": "Grand Palace Tour",          "city": "bangkok",   "country": "Thailand",    "type": "sightseeing", "cost": 1200, "duration_hours": 3.0},
    {"name": "Thai Cooking Class",         "city": "bangkok",   "country": "Thailand",    "type": "food",        "cost": 2000, "duration_hours": 4.0},
    {"name": "Floating Market Tour",       "city": "bangkok",   "country": "Thailand",    "type": "sightseeing", "cost": 1500, "duration_hours": 4.0},
    {"name": "Gardens by the Bay",         "city": "singapore", "country": "Singapore",   "type": "sightseeing", "cost": 1800, "duration_hours": 3.0},
    {"name": "Singapore Food Trail",       "city": "singapore", "country": "Singapore",   "type": "food",        "cost": 1000, "duration_hours": 2.0},
    {"name": "Colosseum Tour",             "city": "rome",      "country": "Italy",       "type": "sightseeing", "cost": 1800, "duration_hours": 3.0},
    {"name": "Vatican Museums",            "city": "rome",      "country": "Italy",       "type": "sightseeing", "cost": 2200, "duration_hours": 4.0},
    {"name": "Roman Food Tour",            "city": "rome",      "country": "Italy",       "type": "food",        "cost": 2000, "duration_hours": 3.0},
    {"name": "Times Square Walk",          "city": "new york",  "country": "USA",         "type": "sightseeing", "cost": 0,    "duration_hours": 2.0},
    {"name": "Statue of Liberty Ferry",    "city": "new york",  "country": "USA",         "type": "sightseeing", "cost": 2500, "duration_hours": 4.0},
    {"name": "Central Park Bike Ride",     "city": "new york",  "country": "USA",         "type": "adventure",   "cost": 1500, "duration_hours": 2.0},
    {"name": "Ubud Rice Terrace Trek",     "city": "bali",      "country": "Indonesia",   "type": "adventure",   "cost": 800,  "duration_hours": 3.0},
    {"name": "Bali Temple Tour",           "city": "bali",      "country": "Indonesia",   "type": "sightseeing", "cost": 600,  "duration_hours": 4.0},
    {"name": "Bali Cooking Class",         "city": "bali",      "country": "Indonesia",   "type": "food",        "cost": 1200, "duration_hours": 3.0},
    {"name": "Gateway of India",           "city": "mumbai",    "country": "India",       "type": "sightseeing", "cost": 0,    "duration_hours": 2.0},
    {"name": "Mumbai Street Food Walk",    "city": "mumbai",    "country": "India",       "type": "food",        "cost": 500,  "duration_hours": 2.0},
    {"name": "Taj Mahal Sunrise Visit",    "city": "delhi",     "country": "India",       "type": "sightseeing", "cost": 1300, "duration_hours": 4.0},
    {"name": "Old Delhi Food Walk",        "city": "delhi",     "country": "India",       "type": "food",        "cost": 600,  "duration_hours": 3.0},
    {"name": "Goa Beach Hopping",          "city": "goa",       "country": "India",       "type": "adventure",   "cost": 400,  "duration_hours": 6.0},
    {"name": "Goa Spice Plantation",       "city": "goa",       "country": "India",       "type": "sightseeing", "cost": 700,  "duration_hours": 3.0},
    {"name": "Sagrada Familia Tour",       "city": "barcelona", "country": "Spain",       "type": "sightseeing", "cost": 2000, "duration_hours": 2.0},
    {"name": "Barcelona Food Tour",        "city": "barcelona", "country": "Spain",       "type": "food",        "cost": 2500, "duration_hours": 3.0},
    {"name": "Anne Frank House",           "city": "amsterdam", "country": "Netherlands", "type": "sightseeing", "cost": 1400, "duration_hours": 2.0},
    {"name": "Amsterdam Canal Cruise",     "city": "amsterdam", "country": "Netherlands", "type": "sightseeing", "cost": 1200, "duration_hours": 1.5},
    {"name": "Sydney Opera House Tour",    "city": "sydney",    "country": "Australia",   "type": "sightseeing", "cost": 3000, "duration_hours": 2.0},
    {"name": "Sydney Harbour Bridge Walk", "city": "sydney",    "country": "Australia",   "type": "adventure",   "cost": 2000, "duration_hours": 3.0},
    {"name": "Pyramids of Giza Tour",      "city": "cairo",     "country": "Egypt",       "type": "sightseeing", "cost": 2000, "duration_hours": 5.0},
    {"name": "Hagia Sophia Visit",         "city": "istanbul",  "country": "Turkey",      "type": "sightseeing", "cost": 800,  "duration_hours": 2.0},
    {"name": "Istanbul Food Tour",         "city": "istanbul",  "country": "Turkey",      "type": "food",        "cost": 1500, "duration_hours": 3.0},
    {"name": "Prague Castle Tour",         "city": "prague",    "country": "Czech Rep",   "type": "sightseeing", "cost": 1200, "duration_hours": 3.0},
    {"name": "Schoenbrunn Palace",         "city": "vienna",    "country": "Austria",     "type": "sightseeing", "cost": 1800, "duration_hours": 3.0},
    {"name": "Gyeongbokgung Palace",       "city": "seoul",     "country": "South Korea", "type": "sightseeing", "cost": 500,  "duration_hours": 2.0},
    {"name": "Seoul Street Food Tour",     "city": "seoul",     "country": "South Korea", "type": "food",        "cost": 1000, "duration_hours": 2.0},
]

DEMO_USERS = [
    {"name": "Demo User",   "email": "demo@traveloop.com",  "password": "demo1234"},
    {"name": "Priya Singh", "email": "priya@traveloop.com", "password": "test1234"},
]


async def seed():
    from sqlalchemy import select, delete

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created ✅")

    async with AsyncSession() as db:
        for u in DEMO_USERS:
            existing = await db.execute(select(User).where(User.email == u["email"]))
            if not existing.scalar_one_or_none():
                db.add(User(
                    id=uuid.uuid4(),
                    name=u["name"],
                    email=u["email"],
                    password_hash=pwd.hash(u["password"]),
                ))
        await db.commit()
        print("Users seeded ✅")

        await db.execute(delete(CityRate))
        for c in CITIES:
            db.add(CityRate(
                id=uuid.uuid4(),
                city=c["city"],
                country=c["country"],
                hotel=c["hotel"],
                food=c["food"],
                transport=c["transport"],
            ))
        await db.commit()
        print(f"City rates seeded ✅  ({len(CITIES)} cities)")

        await db.execute(delete(ActivityCatalog))
        for a in ACTIVITIES:
            db.add(ActivityCatalog(
                id=uuid.uuid4(),
                name=a["name"],
                city=a["city"],
                country=a["country"],
                type=a["type"],
                cost=a["cost"],
                duration_hours=a["duration_hours"],
                description="",
            ))
        await db.commit()
        print(f"Activities seeded ✅  ({len(ACTIVITIES)} activities)")

    print("\n✅ Seed complete!")
    print("Login: demo@traveloop.com / demo1234")


if __name__ == "__main__":
    asyncio.run(seed())