from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base
import traceback

from app.auth.routes import router as auth_router
from app.trips.routes import router as trips_router
from app.stops.routes import router as stops_router
from app.activities.routes import router as activities_router
from app.budget.routes import router as budget_router
from app.checklist.routes import router as checklist_router
from app.notes.routes import router as notes_router
from app.community.routes import router as community_router
from app.search.routes import router as search_router

app = FastAPI(title="Traveloop API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(auth_router,       prefix="/auth", tags=["Auth"])
app.include_router(trips_router,      prefix="/api",  tags=["Trips"])
app.include_router(stops_router,      prefix="/api",  tags=["Stops"])
app.include_router(activities_router, prefix="/api",  tags=["Activities"])
app.include_router(budget_router,     prefix="/api",  tags=["Budget"])
app.include_router(checklist_router,  prefix="/api",  tags=["Checklist"])
app.include_router(notes_router,      prefix="/api",  tags=["Notes"])
app.include_router(community_router,  prefix="/api",  tags=["Community"])
app.include_router(search_router,     prefix="/api",  tags=["Search"])

@app.get("/")
def root():
    return {"message": "Traveloop API running ✅"}