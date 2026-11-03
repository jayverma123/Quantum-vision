import numpy as np
import pytest

from app.api.satellite_quality import (
    identify_bands,
    validate_required_bands,
    calculate_ndvi,
    calculate_ndbi,
    compare_ndvi,
)


def test_sentinel2_band_identification():
    descriptions = (
        "B02", "B03", "B04", "B08", "B11", "B12"
    )

    bands = identify_bands(descriptions, "sentinel-2")

    assert bands["blue"] == 0
    assert bands["green"] == 1
    assert bands["red"] == 2
    assert bands["nir"] == 3
    assert bands["swir1"] == 4
    assert bands["swir2"] == 5


def test_landsat_band_identification():
    descriptions = ("B2", "B3", "B4", "B5", "B6", "B7")

    bands = identify_bands(descriptions, "landsat-8")

    assert bands["red"] == 2
    assert bands["nir"] == 3
    assert bands["swir1"] == 4


def test_missing_bands_are_reported():
    result = validate_required_bands(
        {"red": 2},
        ("red", "nir"),
    )

    assert result["valid"] is False
    assert result["missing_bands"] == ["nir"]


def test_ndvi_calculation():
    # NIR = 0.8, Red = 0.2
    image = np.array([
        [[0.2]],  # Red
        [[0.8]],  # NIR
    ], dtype=np.float32)

    bands = {"red": 0, "nir": 1}

    ndvi = calculate_ndvi(image, bands)

    assert ndvi[0, 0] == pytest.approx(0.6, abs=1e-5)


def test_ndbi_calculation():
    # SWIR = 0.6, NIR = 0.2
    image = np.array([
        [[0.6]],  # SWIR1
        [[0.2]],  # NIR
    ], dtype=np.float32)

    bands = {"swir1": 0, "nir": 1}

    ndbi = calculate_ndbi(image, bands)

    assert ndbi[0, 0] == pytest.approx(0.5, abs=1e-5)


def test_zero_denominator_returns_nan():
    image = np.array([
        [[0.0]],
        [[0.0]],
    ], dtype=np.float32)

    ndvi = calculate_ndvi(
        image,
        {"red": 0, "nir": 1},
    )

    assert np.isnan(ndvi[0, 0])


def test_ndvi_comparison():
    before = np.array([[0.2, 0.3]], dtype=np.float32)
    after = np.array([[0.5, 0.4]], dtype=np.float32)

    result = compare_ndvi(before, after)

    assert result["valid"] is True
    assert result["valid_pixel_count"] == 2
    assert result["mean_ndvi_change"] == pytest.approx(0.2)


def test_unsupported_sensor():
    with pytest.raises(ValueError):
        identify_bands(("B02",), "unknown-sensor")