
import numpy as np


SENTINEL2_BANDS = {
    "B02": "blue",
    "B03": "green",
    "B04": "red",
    "B08": "nir",
    "B11": "swir1",
    "B12": "swir2",
}


LANDSAT_BANDS = {
    "B2": "blue",
    "B3": "green",
    "B4": "red",
    "B5": "nir",
    "B6": "swir1",
    "B7": "swir2",
}


def identify_bands(descriptions, sensor="sentinel-2"):
    """
    Identify spectral bands from explicit GeoTIFF band descriptions.
    Does not guess band identity from band position.
    """

    if sensor.lower() in ("sentinel-2", "sentinel2", "s2"):
        mapping = SENTINEL2_BANDS
    elif sensor.lower() in ("landsat", "landsat-8", "landsat-9"):
        mapping = LANDSAT_BANDS
    else:
        raise ValueError("Unsupported sensor name.")

    identified = {}

    for index, description in enumerate(descriptions or []):
        if not description:
            continue

        label = description.strip().upper()
        label = label.replace("SENTINEL-2", "")
        label = label.replace("SENTINEL 2", "")
        label = label.replace("LANDSAT", "")
        label = label.replace("BAND", "")
        label = label.replace(" ", "")
        label = label.replace("_", "")

        if label in mapping:
            identified[mapping[label]] = index

    return identified


def validate_required_bands(bands, required=("red", "nir")):
    missing = [name for name in required if name not in bands]

    return {
        "valid": not missing,
        "missing_bands": missing,
    }


def calculate_ndvi(image, bands):
    """
    Calculate NDVI from correctly identified red and NIR bands.
    Image layout: (bands, height, width).
    """

    check = validate_required_bands(bands, ("red", "nir"))

    if not check["valid"]:
        raise ValueError(
            "Cannot calculate NDVI. Missing bands: "
            + ", ".join(check["missing_bands"])
        )

    red = image[bands["red"]].astype(np.float32)
    nir = image[bands["nir"]].astype(np.float32)

    denominator = nir + red

    ndvi = np.full(red.shape, np.nan, dtype=np.float32)

    valid = (
        np.isfinite(red)
        & np.isfinite(nir)
        & (np.abs(denominator) > 1e-8)
    )

    ndvi[valid] = (
        (nir[valid] - red[valid])
        / denominator[valid]
    )

    return np.clip(ndvi, -1, 1)


def calculate_ndbi(image, bands):
    """
    Calculate NDBI from correctly identified SWIR1 and NIR bands.
    """

    check = validate_required_bands(bands, ("swir1", "nir"))

    if not check["valid"]:
        raise ValueError(
            "Cannot calculate NDBI. Missing bands: "
            + ", ".join(check["missing_bands"])
        )

    swir = image[bands["swir1"]].astype(np.float32)
    nir = image[bands["nir"]].astype(np.float32)

    denominator = swir + nir

    ndbi = np.full(swir.shape, np.nan, dtype=np.float32)

    valid = (
        np.isfinite(swir)
        & np.isfinite(nir)
        & (np.abs(denominator) > 1e-8)
    )

    ndbi[valid] = (
        (swir[valid] - nir[valid])
        / denominator[valid]
    )

    return np.clip(ndbi, -1, 1)


def estimate_rgb_quality(image, bands):
    """
    Basic image-quality screening.
    Brightness is only a cloud-candidate heuristic,
    not a validated cloud or shadow classifier.
    """

    check = validate_required_bands(
        bands,
        ("red", "green", "blue"),
    )

    if not check["valid"]:
        return {
            "available": False,
            "reason": "RGB bands are not identified.",
        }

    rgb = np.stack([
        image[bands["red"]],
        image[bands["green"]],
        image[bands["blue"]],
    ]).astype(np.float32)

    valid = np.all(np.isfinite(rgb), axis=0)

    if not np.any(valid):
        return {
            "available": False,
            "reason": "No valid RGB pixels.",
        }

    brightness = np.mean(rgb, axis=0)
    cutoff = np.percentile(brightness[valid], 90)

    bright_fraction = (
        np.count_nonzero(valid & (brightness >= cutoff))
        / np.count_nonzero(valid)
    )

    return {
        "available": True,
        "valid_pixel_count": int(np.count_nonzero(valid)),
        "bright_pixel_fraction": round(
            float(bright_fraction), 4
        ),
        "warning": (
            "Bright pixels may be clouds, snow, or other bright surfaces. "
            "This result is not a cloud probability."
        ),
    }


def compare_ndvi(before_ndvi, after_ndvi):
    """Summarize vegetation-index differences over valid pixels."""

    valid = (
        np.isfinite(before_ndvi)
        & np.isfinite(after_ndvi)
    )

    if not np.any(valid):
        return {
            "valid": False,
            "reason": "No overlapping valid NDVI pixels.",
        }

    difference = after_ndvi[valid] - before_ndvi[valid]

    return {
        "valid": True,
        "valid_pixel_count": int(difference.size),
        "mean_ndvi_change": round(
            float(np.mean(difference)), 4
        ),
        "median_ndvi_change": round(
            float(np.median(difference)), 4
        ),
        "note": (
            "NDVI change can reflect vegetation, seasonality, "
            "atmospheric effects, or other factors."
        ),
    }

