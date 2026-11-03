from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/search",
    tags=["Search"]
)


class SearchRequest(BaseModel):
    query: str


# Demo satellite imagery data
DEMO_RESULTS = [
    {
        "id": "QV-SCENE-001",
        "location": "Yamuna River Region",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "sensor": "Sentinel-2",
        "date": "2025-06-12",
        "resolution": "10 m",
        "cloud_cover": 4.2,
        "similarity": 94.2,
        "change_type": "Construction",
    },
    {
        "id": "QV-SCENE-002",
        "location": "Riverbank Urban Area",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "sensor": "Sentinel-2",
        "date": "2024-09-18",
        "resolution": "10 m",
        "cloud_cover": 6.8,
        "similarity": 89.7,
        "change_type": "Expansion",
    },
    {
        "id": "QV-SCENE-003",
        "location": "Open Ground Near River",
        "latitude": 25.5941,
        "longitude": 85.1376,
        "sensor": "Landsat-9",
        "date": "2025-04-21",
        "resolution": "30 m",
        "cloud_cover": 8.1,
        "similarity": 84.5,
        "change_type": "Clearance",
    },
]


@router.post("/text")
def text_search(request: SearchRequest):
    return {
        "query": request.query,
        "mode": "demo-semantic-search",
        "results": DEMO_RESULTS,
        "total_results": len(DEMO_RESULTS),
    }