import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import database
from models import ApplicationIn, ApplicationOut, StatsOut


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    yield


app = FastAPI(title="Job Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/applications", response_model=list[ApplicationOut])
async def list_applications():
    rows = await database.get_all_applications()
    return [ApplicationOut(**row) for row in rows]


@app.post("/api/applications", response_model=ApplicationOut, status_code=201)
async def create_application(data: ApplicationIn):
    app_id = str(uuid.uuid4())
    row = await database.create_application(data, app_id)
    return ApplicationOut(**row)


@app.put("/api/applications/{id}", response_model=ApplicationOut)
async def update_application(id: str, data: ApplicationIn):
    existing = await database.get_application(id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Application not found")
    row = await database.update_application(id, data)
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationOut(**row)


@app.delete("/api/applications/{id}", status_code=204)
async def delete_application(id: str):
    deleted = await database.delete_application(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Application not found")


@app.get("/api/stats", response_model=StatsOut)
async def get_stats():
    stats = await database.get_stats()
    return StatsOut(**stats)
