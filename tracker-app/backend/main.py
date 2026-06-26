import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import os
import shutil

import database
from models import ApplicationIn, ApplicationOut, StatsOut, WishlistItemIn, WishlistItemOut

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


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


@app.post("/api/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"filename": unique_filename}


@app.get("/api/applications/cv/{filename}")
async def get_cv(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="CV not found")
    return FileResponse(file_path, media_type="application/pdf")


@app.get("/api/wishlist", response_model=list[WishlistItemOut])
async def list_wishlist():
    rows = await database.get_all_wishlist()
    return [WishlistItemOut(**row) for row in rows]


@app.post("/api/wishlist", response_model=WishlistItemOut, status_code=201)
async def create_wishlist_item(data: WishlistItemIn):
    item_id = str(uuid.uuid4())
    row = await database.create_wishlist_item(data, item_id)
    return WishlistItemOut(**row)


@app.put("/api/wishlist/{id}", response_model=WishlistItemOut)
async def update_wishlist_item(id: str, data: WishlistItemIn):
    existing = await database.get_wishlist_item(id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    row = await database.update_wishlist_item(id, data)
    if row is None:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return WishlistItemOut(**row)


@app.delete("/api/wishlist/{id}", status_code=204)
async def delete_wishlist_item(id: str):
    deleted = await database.delete_wishlist_item(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
