from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.change import router as change_router

app = FastAPI(
    title="Quantum Vision API",
    description="Satellite imagery and change analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(change_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "project": "Quantum Vision",
        "mode": "local processing",
    }


@app.get("/api/system/status")
def system_status():
    return {
        "status": "online",
        "change_analysis": "available",
        "offline_mode": True,
    }