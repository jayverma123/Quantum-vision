
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.search import router as search_router
from app.api.change import router as change_router
from app.api.satellite import router as satellite_router
from app.ai_assistant import router as ai_router


app = FastAPI(
    title="QuantumVision API",
    description="Satellite Image Search and Multi-Temporal Change Analysis",
    version="0.1.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "QuantumVision",
        "status": "online",
        "mode": "offline/on-premises",
        "version": "0.1.0",
    }


# ---------------------------------------------------------
# API ROUTERS
# ---------------------------------------------------------

app.include_router(search_router)
app.include_router(change_router)
app.include_router(satellite_router)
app.include_router(ai_router)


# ---------------------------------------------------------
# SYSTEM STATUS
# ---------------------------------------------------------

@app.get("/api/system/status")
def system_status():
    return {
        "ai_model": "Groq API configured"
        if ai_router
        else "Not loaded",
        "vector_index": "Not initialized",
        "database": "Demo mode",
        "dataset": "Available",
        "offline_mode": False,
        "gpu": False,
        "indexed_scenes": 0,
        "indexed_tiles": 0,
    }

