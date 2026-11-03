
from fastapi.testclient import TestClient
from PIL import Image
from io import BytesIO
import numpy as np

from main import app

client = TestClient(app)


def create_image(color):
    image = Image.new("RGB", (64, 64), color=color)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def test_identical_images_have_zero_change():
    image1 = create_image((100, 150, 200))
    image2 = create_image((100, 150, 200))

    response = client.post(
        "/api/change/analyze-uploaded",
        files=[
            ("before_files", ("before.png", image1, "image/png")),
            ("after_files", ("after.png", image2, "image/png")),
        ],
    )

    assert response.status_code == 200

    result = response.json()

    assert result["analysis"]["change_percentage"] == 0


def test_different_images_are_compared():
    before = create_image((0, 0, 0))
    after = create_image((255, 255, 255))

    response = client.post(
        "/api/change/analyze-uploaded",
        files=[
            ("before_files", ("before.png", before, "image/png")),
            ("after_files", ("after.png", after, "image/png")),
        ],
    )

    assert response.status_code == 200

    result = response.json()

    assert "change_percentage" in result["analysis"]
    assert result["analysis"]["change_percentage"] >= 0


def test_missing_files_are_rejected():
    response = client.post("/api/change/analyze-uploaded")

    assert response.status_code in (400, 422)



def test_quality_report_is_in_api_response():
    before = create_image((30, 60, 90))
    after = create_image((30, 60, 90))

    response = client.post(
        "/api/change/analyze-uploaded",
        files=[
            ("before_files", ("before.png", before, "image/png")),
            ("after_files", ("after.png", after, "image/png")),
        ],
    )

    assert response.status_code == 200
    result = response.json()
    assert "quality_report" in result
    assert result["quality_report"]["status"] == "available"
    assert result["quality_report"]["valid_pixels"] == 64 * 64


def test_unsupported_file_extension_is_rejected():
    before = create_image((30, 60, 90))
    after = create_image((30, 60, 90))

    response = client.post(
        "/api/change/analyze-uploaded",
        files=[
            ("before_files", ("before.exe", before, "application/octet-stream")),
            ("after_files", ("after.png", after, "image/png")),
        ],
    )

    assert response.status_code == 415


def test_malformed_image_is_rejected_cleanly():
    response = client.post(
        "/api/change/analyze-uploaded",
        files=[
            ("before_files", ("before.png", b"not an image", "image/png")),
            ("after_files", ("after.png", b"not an image", "image/png")),
        ],
    )

    assert response.status_code == 400


def test_mismatched_image_dimensions_are_rejected():
    before = create_image((30, 60, 90))
    after = BytesIO()
    Image.new("RGB", (32, 32), color=(30, 60, 90)).save(after, format="PNG")
    after.seek(0)

    response = client.post(
        "/api/change/analyze-uploaded",
        files=[
            ("before_files", ("before.png", before, "image/png")),
            ("after_files", ("after.png", after, "image/png")),
        ],
    )

    assert response.status_code == 400
