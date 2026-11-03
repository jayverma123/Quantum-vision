from fastapi import APIRouter, UploadFile, File
import tempfile
import os
from app.services.ingestion_service import search_sentinel2_scenes

from app.processing.satellite import (
    inspect_geotiff,
    scan_satellite_data
)
from app.services.copernicus_service import (
    check_copernicus_connection,
)
from fastapi import HTTPException, Query
from fastapi.responses import Response

from app.services.copernicus_service import get_satellite_preview

router = APIRouter(
    prefix="/api/satellite",
    tags=["Satellite Data"]
)


@router.post("/inspect")
async def inspect_satellite(
    file: UploadFile = File(...)
):

    # Check file format
    if not file.filename.lower().endswith(
        (".tif", ".tiff")
    ):

        return {
            "status": "error",
            "message": "Please upload a GeoTIFF (.tif or .tiff) file."
        }

    temp_path = None

    try:

        # Read uploaded file
        file_data = await file.read()

        # Create temporary TIFF file
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".tif"
        ) as temp_file:

            temp_file.write(file_data)
            temp_path = temp_file.name

        # Read GeoTIFF metadata
        metadata = inspect_geotiff(
            temp_path
        )

        return {
            "status": "success",
            "filename": file.filename,
            "metadata": metadata
        }

    except Exception as error:

        return {
            "status": "error",
            "message": f"Could not inspect GeoTIFF: {str(error)}"
        }

    finally:

        # Delete temporary file
        if (
            temp_path
            and os.path.exists(temp_path)
        ):

            os.remove(temp_path)


@router.get("/scan")
def scan_satellite_data_endpoint():

    # Locate the local satellite data folder
    satellite_folder = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "data",
            "satellite"
        )
    )

    # Scan SAFE products and TIFF files
    return scan_satellite_data(
        satellite_folder
    )
@router.get("/search-scenes")
def search_scenes(
    latitude: float = 26.9124,
    longitude: float = 75.7873,
    days_back: int = 30,
    max_cloud_cover: float = 30,
    top: int = 10,
):
    if not -90 <= latitude <= 90:
        return {"success": False, "message": "Invalid latitude."}

    if not -180 <= longitude <= 180:
        return {"success": False, "message": "Invalid longitude."}

    if not 1 <= days_back <= 365:
        return {"success": False, "message": "days_back must be between 1 and 365."}

    if not 0 <= max_cloud_cover <= 100:
        return {"success": False, "message": "Cloud cover must be between 0 and 100."}

    if not 1 <= top <= 50:
        return {"success": False, "message": "top must be between 1 and 50."}

    return search_sentinel2_scenes(
        latitude=latitude,
        longitude=longitude,
        days_back=days_back,
        max_cloud_cover=max_cloud_cover,
        top=top,
    )
@router.get("/connection-test")
def copernicus_connection_test():
    return check_copernicus_connection()
@router.get("/preview")
def satellite_preview(
    latitude: float = 26.9124,
    longitude: float = 75.7873,
    days_back: int = Query(default=30, ge=1, le=90),
):
    if not -90 <= latitude <= 90:
        raise HTTPException(
            status_code=400,
            detail="Invalid latitude.",
        )

    if not -180 <= longitude <= 180:
        raise HTTPException(
            status_code=400,
            detail="Invalid longitude.",
        )

    try:
        image_bytes = get_satellite_preview(
            latitude=latitude,
            longitude=longitude,
            days_back=days_back,
        )

        return Response(
            content=image_bytes,
            media_type="image/png",
            headers={
                "Cache-Control": "no-store",
            },
        )

    except Exception as error:
        print("Satellite preview error:", repr(error))

        raise HTTPException(
            status_code=502,
            detail=(
                "Could not retrieve satellite imagery. "
                "Check the backend terminal for details."
            ),
        )