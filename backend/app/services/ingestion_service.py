
import os
import requests
from datetime import datetime, timedelta, timezone

COPERNICUS_CATALOG_URL = (
    "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
)


def search_sentinel2_scenes(
    latitude=26.9124,
    longitude=75.7873,
    days_back=30,
    max_cloud_cover=30,
    top=10,
):
    """
    Search the Copernicus Data Space catalogue for
    Sentinel-2 L2A scenes around a geographic point.

    Defaults to Jaipur, Rajasthan.
    Returns scene metadata, not the actual image pixels.
    """

    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days_back)

    start_text = start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    end_text = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    point_wkt = f"POINT ({longitude} {latitude})"

    params = {
        "$filter": (
            "Collection/Name eq 'SENTINEL-2' "
            "and Attributes/OData.CSC.StringAttribute/any("
            "att:att/Name eq 'productType' "
            "and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A') "
            f"and ContentDate/Start gt {start_text} "
            f"and ContentDate/Start lt {end_text} "
            f"and OData.CSC.Intersects(area=geography'SRID=4326;{point_wkt}')"
        ),
        "$orderby": "ContentDate/Start desc",
        "$top": min(max(int(top), 1), 50),
        "$expand": "Attributes",
    }

    try:
        response = requests.get(
            COPERNICUS_CATALOG_URL,
            params=params,
            timeout=30,
        )
        response.raise_for_status()
        products = response.json().get("value", [])

        scenes = []

        for product in products:
            attributes = {
                item.get("Name"): item.get("Value")
                for item in product.get("Attributes", [])
            }

            cloud_cover = attributes.get("cloudCover")

            try:
                cloud_cover = float(cloud_cover)
            except (TypeError, ValueError):
                cloud_cover = None

            # Retain unknown cloud cover, otherwise apply the requested limit.
            if (
                cloud_cover is not None
                and cloud_cover > max_cloud_cover
            ):
                continue

            scenes.append({
                "id": product.get("Id"),
                "name": product.get("Name"),
                "collection": "Sentinel-2",
                "acquisition_date": (
                    product.get("ContentDate", {}).get("Start")
                ),
                "cloud_cover_percent": cloud_cover,
                "size_bytes": product.get("ContentLength"),
                "download_available": bool(product.get("Id")),
            })

        return {
            "success": True,
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "date_range": {
                "start": start_text,
                "end": end_text,
            },
            "scene_count": len(scenes),
            "scenes": scenes,
            "note": (
                "These are catalogue search results. "
                "Actual image pixels have not been downloaded or analyzed."
            ),
        }

    except requests.RequestException as error:
        return {
            "success": False,
            "message": "Could not connect to the Copernicus catalogue.",
            "error": str(error),
            "scenes": [],
        }

