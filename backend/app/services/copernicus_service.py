
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

# Load credentials from backend/.env
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_FILE)

CLIENT_ID = os.getenv("CDSE_CLIENT_ID")
CLIENT_SECRET = os.getenv("CDSE_CLIENT_SECRET")

TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/"
    "auth/realms/CDSE/protocol/openid-connect/token"
)

PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"


def get_access_token():
    """Authenticate with Copernicus and return an access token."""

    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError(
            "Copernicus credentials are missing from backend/.env"
        )

    response = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        timeout=30,
    )

    response.raise_for_status()
    return response.json()["access_token"]


def check_copernicus_connection():
    """Check authentication without exposing credentials."""

    try:
        token = get_access_token()

        return {
            "success": True,
            "message": "Copernicus authentication successful.",
            "token_received": bool(token),
        }

    except Exception as error:
        print("Copernicus connection error:", str(error))

        return {
            "success": False,
            "message": (
                "Copernicus authentication failed. "
                "Check your credentials and backend terminal."
            ),
        }


def get_satellite_preview(
    latitude=26.9124,
    longitude=75.7873,
    days_back=30,
    image_size=512,
):
    """Request a true-colour Sentinel-2 image preview."""

    token = get_access_token()

    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days_back)

    # Approximate area around the selected point.
    half_size = 0.025

    bbox = [
        longitude - half_size,
        latitude - half_size,
        longitude + half_size,
        latitude + half_size,
    ]

    payload = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {
                    "crs": "http://www.opengis.net/def/crs/EPSG/0/4326"
                },
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": start_date.strftime(
                                "%Y-%m-%dT%H:%M:%SZ"
                            ),
                            "to": end_date.strftime(
                                "%Y-%m-%dT%H:%M:%SZ"
                            ),
                        },
                        "mosaickingOrder": "mostRecent",
                        "maxCloudCoverage": 30,
                    },
                }
            ],
        },
        "output": {
            "width": image_size,
            "height": image_size,
            "responses": [
                {
                    "identifier": "default",
                    "format": {"type": "image/png"},
                }
            ],
        },
        "evalscript": """
        //VERSION=3
        function setup() {
            return {
                input: ["B02", "B03", "B04", "dataMask"],
                output: {
                    bands: 4,
                    sampleType: "AUTO"
                }
            };
        }

        function evaluatePixel(sample) {
            return [
                2.5 * sample.B04,
                2.5 * sample.B03,
                2.5 * sample.B02,
                sample.dataMask
            ];
        }
        """,
    }

    response = requests.post(
        PROCESS_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=90,
    )

    if not response.ok:
        print(
            "Satellite preview error:",
            response.status_code,
            response.text[:1000],
        )
        response.raise_for_status()

    return response.content

