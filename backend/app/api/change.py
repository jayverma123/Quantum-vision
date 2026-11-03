
import io
import base64
import logging
from typing import Optional

import numpy as np
import rasterio
from app.api.change_quality import generate_change_quality_report

from app.api.satellite_preprocessing import (
    align_satellite_images,
    clean_change_mask,
    calculate_change_statistics,
)

from app.api.satellite_quality import (
    identify_bands,
    validate_required_bands,
    calculate_ndvi,
    calculate_ndbi,
    estimate_rgb_quality,
    compare_ndvi,
)





from PIL import Image, ImageFilter
from fastapi import APIRouter, UploadFile, File, HTTPException
from rasterio.io import MemoryFile

router = APIRouter(prefix="/api/change", tags=["Change Detection"])

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 100 * 1024 * 1024
MAX_PIXELS = 10_000_000
DEFAULT_THRESHOLD = 0.12
ALLOWED_RASTER_EXTENSIONS = {".tif", ".tiff"}
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

SENSOR_BANDS = {
    "sentinel-2": {"red": "B04", "nir": "B08", "swir": "B11"},
    "landsat-8": {"red": "B4", "nir": "B5", "swir": "B6"},
    "landsat-9": {"red": "B4", "nir": "B5", "swir": "B6"},
}


# ---------------------------------------------------------
# FILE HANDLING
# ---------------------------------------------------------

async def read_upload(file: UploadFile) -> bytes:
    data = await file.read(MAX_FILE_SIZE + 1)

    if not data:
        raise HTTPException(400, f"{file.filename}: empty file")

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(413, "Maximum file size is 100 MB")

    return data


def encode_image(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


# ---------------------------------------------------------
# IMAGE LOADING
# ---------------------------------------------------------

def load_geotiff(data: bytes, filename: str) -> Optional[dict]:
    """
    Load all raster bands so spectral bands beyond the first
    three remain available.

    Band descriptions are retained when provided by the file.
    """

    try:
        with MemoryFile(data) as memfile:
            with memfile.open() as src:

                if src.count < 1:
                    raise ValueError("Raster contains no bands.")

                if src.width * src.height > MAX_PIXELS:
                    raise ValueError(
                        "Raster exceeds the 10-million-pixel limit. "
                        "Prepare a smaller area before uploading."
                    )

                # Read all bands, not just RGB.
                masked = src.read(
                    out_dtype="float32",
                    masked=True
                )

                array = np.asarray(
                    masked.filled(np.nan),
                    dtype=np.float32
                )

                # Only pixels valid in all bands are used for
                # the general multiband comparison.
                valid_mask = np.all(np.isfinite(array), axis=0)

                for band_index in range(1, src.count + 1):
                    valid_mask &= src.read_masks(band_index) > 0

                if not np.any(valid_mask):
                    raise ValueError("No valid raster pixels found.")

                return {
                    "array": array,
                    "valid_mask": valid_mask,
                    "width": src.width,
                    "height": src.height,
                    "bands": src.count,
                    "crs": str(src.crs) if src.crs else None,
                    "transform": tuple(src.transform)[:6],
                    "bounds": tuple(src.bounds),
                    "nodata": src.nodata,
                    "resolution": (
                        abs(src.transform.a),
                        abs(src.transform.e)
                    ),
                    "dtype": str(src.dtypes[0]),
                    "filename": filename,
                    "source": "GeoTIFF",
                    "scale": tuple(src.scales),
                    "offset": tuple(src.offsets),
                    "descriptions": tuple(src.descriptions),
                }

    except Exception as exc:
        logger.warning("Could not read GeoTIFF %s: %s", filename, exc)
        return None


def load_regular_image(data: bytes, filename: str) -> dict:
    try:
        with Image.open(io.BytesIO(data)) as image:
            # Check dimensions before decoding pixel data to reduce the risk
            # of decompression-bomb uploads consuming excessive memory.
            if image.width <= 0 or image.height <= 0:
                raise ValueError("Image dimensions are invalid.")
            if image.width * image.height > MAX_PIXELS:
                raise ValueError(
                    f"Image exceeds the {MAX_PIXELS:,}-pixel limit."
                )

            image.load()
            image = image.convert("RGB")
            array = np.asarray(image, dtype=np.float32)
            array = np.moveaxis(array, -1, 0)

            return {
                "array": array,
                "valid_mask": np.ones(
                    (image.height, image.width), dtype=bool
                ),
                "width": image.width,
                "height": image.height,
                "bands": 3,
                "crs": None,
                "transform": None,
                "bounds": None,
                "nodata": None,
                "resolution": None,
                "dtype": "uint8",
                "filename": filename,
                "source": "Regular image",
                "scale": (1.0, 1.0, 1.0),
                "offset": (0.0, 0.0, 0.0),
                "descriptions": (),
            }

    except Exception as exc:
        raise HTTPException(
            400, f"Cannot read image {filename}: {exc}"
        )


def load_image(data: bytes, filename: str) -> dict:
    """Load only explicitly supported image formats."""
    from pathlib import Path

    extension = Path(filename).suffix.lower()

    if extension in ALLOWED_RASTER_EXTENSIONS:
        result = load_geotiff(data, filename)

        if result is None:
            raise HTTPException(
                400,
                f"Cannot read GeoTIFF {filename}. "
                "Check that it is a supported raster."
            )

        return result

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            415,
            "Unsupported file type. Use PNG, JPG, JPEG, WEBP, BMP, "
            "TIF, or TIFF."
        )

    return load_regular_image(data, filename)


# ---------------------------------------------------------
# DATA PREPARATION
# ---------------------------------------------------------

def prepare_reflectance(dataset: dict) -> np.ndarray:
    """Apply scale and offset metadata supplied by the raster."""

    array = dataset["array"].astype(np.float32, copy=True)

    for i in range(array.shape[0]):
        scale = dataset["scale"][i]
        offset = dataset["offset"][i]

        if scale is None:
            scale = 1.0

        if offset is None:
            offset = 0.0

        array[i] = array[i] * scale + offset

    array[:, ~dataset["valid_mask"]] = np.nan

    return array


def align_geotiff_pair(before: dict, after: dict) -> tuple[dict, dict]:
    """Reproject the AFTER GeoTIFF onto the BEFORE GeoTIFF pixel grid.

    This makes the comparison grid-compatible; it does not perform
    atmospheric correction, cloud masking, or semantic classification.
    """
    if before["source"] != "GeoTIFF" or after["source"] != "GeoTIFF":
        return before, after

    if before["bands"] != after["bands"]:
        raise HTTPException(
            400,
            "Before and after GeoTIFFs must contain the same number of bands. "
            "Upload matching bands or matching multiband composites."
        )

    same_grid = (
        before["crs"] == after["crs"]
        and before["transform"] == after["transform"]
        and before["width"] == after["width"]
        and before["height"] == after["height"]
    )
    if same_grid:
        return before, after

    from affine import Affine
    from rasterio.crs import CRS
    from rasterio.warp import reproject, Resampling

    if not before["crs"] or not after["crs"]:
        raise HTTPException(400, "Both GeoTIFFs must contain a valid CRS to align them.")

    dst_shape = (before["height"], before["width"])
    aligned = np.full(
        (after["bands"], *dst_shape), np.nan, dtype=np.float32
    )
    src_transform = Affine(*after["transform"])
    dst_transform = Affine(*before["transform"])
    src_crs = CRS.from_string(after["crs"])
    dst_crs = CRS.from_string(before["crs"])

    for index in range(after["bands"]):
        reproject(
            source=after["array"][index],
            destination=aligned[index],
            src_transform=src_transform,
            src_crs=src_crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            src_nodata=np.nan,
            dst_nodata=np.nan,
            resampling=Resampling.bilinear,
        )

    valid_source = np.asarray(after["valid_mask"], dtype=np.uint8)
    aligned_mask = np.zeros(dst_shape, dtype=np.uint8)
    reproject(
        source=valid_source,
        destination=aligned_mask,
        src_transform=src_transform,
        src_crs=src_crs,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        src_nodata=0,
        dst_nodata=0,
        resampling=Resampling.nearest,
    )

    after = dict(after)
    after.update({
        "array": aligned,
        "valid_mask": (aligned_mask > 0) & np.all(np.isfinite(aligned), axis=0),
        "width": before["width"],
        "height": before["height"],
        "crs": before["crs"],
        "transform": before["transform"],
        "bounds": before["bounds"],
        "resolution": before["resolution"],
    })

    if not np.any(before["valid_mask"] & after["valid_mask"]):
        raise HTTPException(400, "The GeoTIFFs have no overlapping valid pixels after alignment.")

    return before, after


def validate_pair(before: dict, after: dict) -> None:
    if before["array"].shape != after["array"].shape:
        raise HTTPException(
            400,
            "Before and after images must have matching dimensions "
            "and band counts. Prepare matching image grids first."
        )

    if before["source"] == "GeoTIFF" and after["source"] == "GeoTIFF":

        if before["crs"] != after["crs"]:
            raise HTTPException(
                400,
                "The GeoTIFF coordinate reference systems differ. "
                "Reproject both images to the same CRS first."
            )

        if before["transform"] != after["transform"]:
            raise HTTPException(
                400,
                "The GeoTIFF pixel grids differ. Align both images "
                "to the same grid before comparison."
            )


# ---------------------------------------------------------
# PREVIEW GENERATION
# ---------------------------------------------------------

def stretch_band(
    band: np.ndarray,
    valid_mask: np.ndarray
) -> np.ndarray:

    valid = valid_mask & np.isfinite(band)
    output = np.zeros(band.shape, dtype=np.uint8)

    if not np.any(valid):
        return output

    low, high = np.percentile(band[valid], [2, 98])

    if high <= low:
        return output

    scaled = np.clip((band - low) / (high - low), 0, 1)
    output[valid] = (scaled[valid] * 255).astype(np.uint8)

    return output


def create_preview(dataset: dict) -> Image.Image:
    array = prepare_reflectance(dataset)
    valid = dataset["valid_mask"]

    # A simple preview using the first three bands.
    # This is not guaranteed to be true-colour satellite imagery.
    if array.shape[0] >= 3:
        rgb = np.stack([
            stretch_band(array[0], valid),
            stretch_band(array[1], valid),
            stretch_band(array[2], valid),
        ], axis=-1)

    elif array.shape[0] == 2:
        first = stretch_band(array[0], valid)
        second = stretch_band(array[1], valid)
        rgb = np.stack([first, second, second], axis=-1)

    else:
        gray = stretch_band(array[0], valid)
        rgb = np.stack([gray, gray, gray], axis=-1)

    return Image.fromarray(rgb)


# ---------------------------------------------------------
# SPECTRAL BAND IDENTIFICATION
# ---------------------------------------------------------

def normalise_band_name(name: str) -> str:
    return (
        name.lower()
        .replace("_", "")
        .replace("-", "")
        .replace(" ", "")
        .strip()
    )


def detect_spectral_bands(
    descriptions: tuple,
    sensor: str
) -> dict:
    """
    Identify bands from explicit descriptions.

    Returns Rasterio's 1-based band indexes.
    It does not guess bands when descriptions are missing.
    """

    sensor = sensor.lower().replace("_", "-").strip()

    if sensor not in SENSOR_BANDS:
        raise ValueError(f"Unsupported sensor: {sensor}")

    aliases = {
        "red": {"red", "b04", "band4", "srband4"},
        "nir": {"nir", "nearinfrared", "b08", "b8", "b05",
                "b5", "band5", "srband5"},
        "swir": {"swir", "swir1", "b11", "b6", "band6",
                 "srband6"},
    }

    if sensor in ("landsat-8", "landsat-9"):
        aliases["red"] = {"red", "b4", "band4", "srband4"}
        aliases["nir"] = {"nir", "b5", "band5", "srband5"}
        aliases["swir"] = {
            "swir", "swir1", "b6", "band6", "srband6"
        }
    else:
        aliases["red"] = {"red", "b04"}
        aliases["nir"] = {"nir", "b08", "b8"}
        aliases["swir"] = {"swir", "swir1", "b11"}

    detected = {}

    for index, description in enumerate(descriptions, start=1):
        if not description:
            continue

        name = normalise_band_name(description)

        for spectral_name, names in aliases.items():
            if name in names:
                detected[spectral_name] = index

    return detected


def extract_spectral_arrays(
    dataset: dict,
    detected_bands: dict
) -> dict:

    if dataset["source"] != "GeoTIFF":
        raise ValueError("Spectral analysis requires GeoTIFF input.")

    array = prepare_reflectance(dataset)
    output = {}

    for name in ("red", "nir", "swir"):
        if name not in detected_bands:
            continue

        index = detected_bands[name] - 1

        if 0 <= index < array.shape[0]:
            output[name] = array[index]

    return output


# ---------------------------------------------------------
# SPECTRAL INDICES
# ---------------------------------------------------------

def safe_normalized_difference(
    first: np.ndarray,
    second: np.ndarray
) -> np.ndarray:

    denominator = first + second

    return np.divide(
        first - second,
        denominator,
        out=np.full_like(first, np.nan, dtype=np.float32),
        where=np.abs(denominator) > 1e-8
    )


def calculate_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    """Vegetation index: (NIR - Red) / (NIR + Red)."""
    return safe_normalized_difference(nir, red)


def calculate_ndbi(swir: np.ndarray, nir: np.ndarray) -> np.ndarray:
    """Built-up surface indicator: (SWIR - NIR) / (SWIR + NIR)."""
    return safe_normalized_difference(swir, nir)


def calculate_indices(bands: dict) -> dict:
    required = {"red", "nir", "swir"}
    missing = required - bands.keys()

    if missing:
        raise ValueError(
            f"Missing required spectral bands: {sorted(missing)}"
        )

    return {
        "ndvi": calculate_ndvi(bands["nir"], bands["red"]),
        "ndbi": calculate_ndbi(bands["swir"], bands["nir"]),
    }


# ---------------------------------------------------------
# SPECTRAL DIFFERENCE
# ---------------------------------------------------------

def calculate_spectral_change(
    before: np.ndarray,
    after: np.ndarray,
    valid_mask: np.ndarray
) -> dict:

    if before.shape != after.shape:
        raise ValueError("Spectral arrays must have matching shapes.")

    if before.ndim != 3 or valid_mask.shape != before.shape[1:]:
        raise ValueError("Invalid spectral array or mask shape.")

    valid = (
        valid_mask
        & np.all(np.isfinite(before), axis=0)
        & np.all(np.isfinite(after), axis=0)
    )

    if not np.any(valid):
        raise ValueError("No valid overlapping pixels.")

    differences = np.abs(after - before)
    scaled = np.zeros_like(differences, dtype=np.float32)

    for i in range(before.shape[0]):
        scale = float(np.percentile(differences[i][valid], 95))

        if scale > 1e-8:
            scaled[i] = np.clip(differences[i] / scale, 0, 1)

    combined = np.mean(scaled, axis=0)
    combined[~valid] = 0

    return {
        "combined_difference": combined,
        "band_differences": differences,
        "valid_mask": valid,
    }


# ---------------------------------------------------------
# CHANGE DETECTION
# ---------------------------------------------------------


def calculate_change(
    before: dict,
    after: dict,
    threshold: float = DEFAULT_THRESHOLD
) -> dict:

    from scipy.ndimage import median_filter, binary_opening, binary_closing

    validate_pair(before, after)

    if not 0 < threshold <= 1:
        raise HTTPException(
            400,
            "Threshold must be greater than 0 and at most 1."
        )

    before_array = prepare_reflectance(before)
    after_array = prepare_reflectance(after)

    valid = (
        before["valid_mask"]
        & after["valid_mask"]
        & np.all(np.isfinite(before_array), axis=0)
        & np.all(np.isfinite(after_array), axis=0)
    )

    if not np.any(valid):
        raise HTTPException(
            400,
            "No overlapping valid pixels found."
        )

    before_norm = np.zeros_like(before_array, dtype=np.float32)
    after_norm = np.zeros_like(after_array, dtype=np.float32)

    # Normalize both images using the same per-band limits.
    for i in range(before_array.shape[0]):
        combined = np.concatenate([
            before_array[i][valid],
            after_array[i][valid]
        ])

        low, high = np.percentile(combined, [2, 98])

        if high > low:
            before_norm[i] = np.clip(
                (before_array[i] - low) / (high - low),
                0,
                1
            )

            after_norm[i] = np.clip(
                (after_array[i] - low) / (high - low),
                0,
                1
            )

    # Calculate mean absolute difference across bands.
    difference = np.mean(
        np.abs(before_norm - after_norm),
        axis=0
    ).astype(np.float32)

    difference[~valid] = 0

    # Initial threshold-based change mask.
    raw_mask = (difference >= threshold) & valid

    # Remove isolated noise and close small gaps.
    filtered_mask = median_filter(
        raw_mask.astype(np.uint8),
        size=3
    ).astype(bool)

    filtered_mask = binary_opening(filtered_mask)
    filtered_mask = binary_closing(filtered_mask)

    change_mask = filtered_mask & valid

    # Calculate statistics using valid pixels only.
    changed_pixels = int(np.count_nonzero(change_mask))
    total_pixels = int(np.count_nonzero(valid))

    change_percentage = (
        changed_pixels / total_pixels * 100
        if total_pixels else 0.0
    )

    valid_differences = difference[valid]

    diff_max = float(
        np.percentile(valid_differences, 99)
    )

    if diff_max > 0:
        difference_display = np.clip(
            difference / diff_max * 255,
            0,
            255
        ).astype(np.uint8)
    else:
        difference_display = np.zeros(
            difference.shape,
            dtype=np.uint8
        )

    difference_display[~valid] = 0

    # Generate visual previews.
    before_preview = np.asarray(
        create_preview(before)
    ).copy()

    after_preview = np.asarray(
        create_preview(after)
    ).copy()

    overlay = after_preview.copy()

    red = np.zeros_like(overlay)
    red[..., 0] = 255

    overlay[change_mask] = (
        0.45 * overlay[change_mask]
        + 0.55 * red[change_mask]
    ).astype(np.uint8)

    overlay[~valid] = 0

    quality_report = generate_change_quality_report(
        difference=difference,
        change_mask=change_mask,
        valid_mask=valid,
        threshold=threshold,
    )
    return {
        "changed_pixels": changed_pixels,
        "total_pixels": total_pixels,
        "change_percentage": round(
            change_percentage, 4
        ),
        "change_detected": changed_pixels > 0,
        "threshold": threshold,
        "before_image": Image.fromarray(before_preview),
        "after_image": Image.fromarray(after_preview),
        "overlay_image": Image.fromarray(overlay),
        "difference_image": Image.fromarray(
            difference_display
        ),
        "valid_mask": valid,
        "change_mask": change_mask,
        "quality_report": quality_report,
    }





# ---------------------------------------------------------
# API ENDPOINT
# ---------------------------------------------------------

@router.post("/analyze-uploaded")
async def analyze_uploaded(
    before_files: list[UploadFile] = File(...),
    after_files: list[UploadFile] = File(...),
):
    if not before_files or not after_files:
        raise HTTPException(
            400, "Upload at least one before and one after image."
        )

    # This endpoint currently compares the first image from each list.
    before_file = before_files[0]
    after_file = after_files[0]

    before_data = await read_upload(before_file)
    after_data = await read_upload(after_file)

    before = load_image(
        before_data, before_file.filename or "before"
    )
    after = load_image(
        after_data, after_file.filename or "after"
    )

    # TIFF rasters may have different CRS/resolution/grids. Align the newer
    # raster onto the older raster's grid before calculating pixel differences.
    before, after = align_geotiff_pair(before, after)
    result = calculate_change(before, after)

    # Spectral analysis is optional. The ordinary image workflow
    # still works when band metadata is unavailable.
    spectral_analysis = {
        "available": False,
        "sensor": None,
        "mean_ndvi_change": None,
        "mean_ndbi_change": None,
        "message": (
            "Spectral indices require GeoTIFFs with verified "
            "Red, NIR, and SWIR band descriptions."
        ),
    }

    if (
        before["source"] == "GeoTIFF"
        and after["source"] == "GeoTIFF"
    ):
        try:
            # Band descriptions must explicitly identify the bands.
            # The sensor is not guessed from arbitrary raster data.
            detected_before = detect_spectral_bands(
                before["descriptions"], "sentinel-2"
            )
            detected_after = detect_spectral_bands(
                after["descriptions"], "sentinel-2"
            )

            required = {"red", "nir", "swir"}

            if (
                required.issubset(detected_before)
                and required.issubset(detected_after)
            ):
                before_bands = extract_spectral_arrays(
                    before, detected_before
                )
                after_bands = extract_spectral_arrays(
                    after, detected_after
                )

                before_indices = calculate_indices(before_bands)
                after_indices = calculate_indices(after_bands)
                if (
                    before["valid_mask"].shape != after["valid_mask"].shape
                    or before["valid_mask"].shape != before_indices["ndvi"].shape
                    or before_indices["ndvi"].shape != after_indices["ndvi"].shape
                    or before_indices["ndvi"].shape != before_indices["ndbi"].shape
                    or before_indices["ndbi"].shape != after_indices["ndbi"].shape
                ):
                    raise ValueError(
                        "Before and after images and spectral indices must have matching shapes."
                    )

                valid = (
                    np.asarray(before["valid_mask"], dtype=bool)
                    & np.asarray(after["valid_mask"], dtype=bool)
                    & np.isfinite(before_indices["ndvi"])
                    & np.isfinite(after_indices["ndvi"])
                    & np.isfinite(before_indices["ndbi"])
                    & np.isfinite(after_indices["ndbi"])
                )

                
                if np.any(valid):
                    ndvi_delta = (
                        after_indices["ndvi"]
                        - before_indices["ndvi"]
                    )
                    ndbi_delta = (
                        after_indices["ndbi"]
                        - before_indices["ndbi"]
                    )

                    spectral_analysis = {
                        "available": True,
                        "sensor": "sentinel-2",
                        "mean_ndvi_change": round(
                            float(np.mean(ndvi_delta[valid])), 4
                        ),
                        "mean_ndbi_change": round(
                            float(np.mean(ndbi_delta[valid])), 4
                        ),
                        "message": (
                            "Indices calculated from band descriptions. "
                            "Confirm sensor, band mapping, and reflectance "
                            "scaling before interpreting the results."
                        ),
                    }

        except (ValueError, IndexError) as exc:
            logger.info("Spectral analysis unavailable: %s", exc)

    # Stage 2: conservative semantic labels from spectral indices.
    # These are candidate labels, not confirmed land-use classifications.
    semantic_classification = {
        "available": False,
        "method": "NDVI/NDBI rule-based screening",
        "classes": [],
        "message": (
            "Semantic labels require aligned GeoTIFFs with explicitly "
            "identified Red, NIR, and SWIR bands. RGB-only imagery cannot "
            "reliably distinguish construction from deforestation."
        ),
        "is_confirmed": False,
    }

    if spectral_analysis.get("available"):
        try:
            before_indices = calculate_indices(
                extract_spectral_arrays(before, detected_before)
            )
            after_indices = calculate_indices(
                extract_spectral_arrays(after, detected_after)
            )
            candidate_mask = (
                np.asarray(result["valid_mask"], dtype=bool)
                & np.asarray(result["change_mask"], dtype=bool)
                & np.isfinite(before_indices["ndvi"])
                & np.isfinite(after_indices["ndvi"])
                & np.isfinite(before_indices["ndbi"])
                & np.isfinite(after_indices["ndbi"])
            )
            ndvi_delta = after_indices["ndvi"] - before_indices["ndvi"]
            ndbi_delta = after_indices["ndbi"] - before_indices["ndbi"]

            # Use only pixels already flagged by the image-difference stage.
            # Thresholds are screening heuristics and need validation per sensor/region.
            candidate_mask &= result["valid_mask"]
            vegetation_loss = (
                candidate_mask
                & (ndvi_delta <= -0.15)
                & (ndbi_delta < 0.10)
            )
            built_up_expansion = (
                candidate_mask
                & (ndbi_delta >= 0.10)
                & (ndvi_delta <= 0.05)
            )
            other_change = candidate_mask & ~(vegetation_loss | built_up_expansion)
            denominator = int(np.count_nonzero(candidate_mask))

            def class_record(label, mask, explanation):
                count = int(np.count_nonzero(mask))
                return {
                    "label": label,
                    "candidate_pixels": count,
                    "percentage_of_valid_pixels": round(
                        count / max(int(result["total_pixels"]), 1) * 100, 4
                    ),
                    "percentage_of_changed_pixels": round(
                        count / max(denominator, 1) * 100, 2
                    ),
                    "interpretation": explanation,
                    "is_confirmed": False,
                }

            semantic_classification = {
                "available": True,
                "method": "Rule-based NDVI/NDBI screening within detected-change pixels",
                "classes": [
                    class_record(
                        "potential_vegetation_loss", vegetation_loss,
                        "NDVI decreased by at least 0.15 without a strong NDBI increase; may be vegetation loss, but season, drought, fire, cloud/shadow, and registration effects can look similar."
                    ),
                    class_record(
                        "potential_built_up_expansion", built_up_expansion,
                        "NDBI increased by at least 0.10 with no meaningful NDVI increase; this is a built-up-surface indicator, not proof of construction. Bare soil and other surfaces may produce similar signals."
                    ),
                    class_record(
                        "other_or_ambiguous_change", other_change,
                        "Changed pixels did not meet the conservative vegetation-loss or built-up-expansion rules."
                    ),
                ],
                "screened_changed_pixels": denominator,
                "thresholds": {"ndvi_decrease": -0.15, "ndbi_increase": 0.10},
                "message": (
                    "These are preliminary spectral indicators, not a trained "
                    "land-cover model or verified real-world events. Review imagery "
                    "and validate against reference labels before operational use."
                ),
                "is_confirmed": False,
            }
        except (ValueError, IndexError, KeyError) as exc:
            logger.info("Semantic screening unavailable: %s", exc)

    before_b64 = encode_image(result["before_image"])
    after_b64 = encode_image(result["after_image"])
    overlay_b64 = encode_image(result["overlay_image"])
    difference_b64 = encode_image(result["difference_image"])

    both_geotiff = (
        before["source"] == "GeoTIFF"
        and after["source"] == "GeoTIFF"
    )

    geospatial_metadata_available = (
        both_geotiff
        and before["crs"] is not None
        and after["crs"] is not None
    )

    return {
        "status": "success",

        "analysis": {
            "change_detected": result["change_detected"],
            "change_percentage": result["change_percentage"],
            "changed_pixels": result["changed_pixels"],
            "total_pixels": result["total_pixels"],
            "change_type": (
                "Potential spectral change"
                if result["change_detected"]
                else "No threshold-exceeding change detected"
            ),
            "threshold": result["threshold"],
        },

        "spectral_analysis": spectral_analysis,
        "semantic_classification": semantic_classification,

        # Detailed image-difference metrics for the frontend/API consumers.
        "quality_report": result["quality_report"],

        "quality": {
            "alignment": "Dimensions and pixel grid validated",
            "dimensions": {
                "width": before["width"],
                "height": before["height"],
            },
            "valid_pixels": result["total_pixels"],
            "geospatial_metadata_available":
                geospatial_metadata_available,
        },

        "images": {
            "before": before_b64,
            "after": after_b64,
            "change_overlay": overlay_b64,
            "difference_map": difference_b64,
        },

        "provenance": {
            "processing": {
                "method": "Mean absolute band difference",
                "threshold": result["threshold"],
                "before_filename": before["filename"],
                "after_filename": after["filename"],
                "before_source": before["source"],
                "after_source": after["source"],
                "before_crs": before["crs"],
                "after_crs": after["crs"],
                "bands_compared": before["array"].shape[0],
                "valid_pixels": result["total_pixels"],
            }
        },

        "note": (
            "Results indicate candidate image changes, not confirmed "
            "construction. Reliable satellite analysis also requires "
            "appropriate band mapping, atmospheric and cloud handling, "
            "sensor harmonization, and image co-registration."
        ),
    }

@router.post("/analyze-geotiff")
async def analyze_geotiff(
    before_file: UploadFile = File(...),
    after_file: UploadFile = File(...),
):
    import os
    import tempfile
    import numpy as np

    from fastapi import HTTPException

    temp_paths = []

    try:
        # Save uploaded files temporarily.
        for uploaded in (before_file, after_file):
            filename = (uploaded.filename or "").lower()

            if not filename.endswith((".tif", ".tiff")):
                raise HTTPException(
                    status_code=400,
                    detail="Upload GeoTIFF files (.tif or .tiff).",
                )

            content = await uploaded.read(MAX_FILE_SIZE + 1)

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail="Each file must be no larger than 100 MB.",
                )

            if not content:
                raise HTTPException(
                    status_code=400,
                    detail="An uploaded file is empty.",
                )

            handle = tempfile.NamedTemporaryFile(
                suffix=".tif",
                delete=False,
            )
            temp_paths.append(handle.name)

            try:
                handle.write(content)
            finally:
                handle.close()

        # Align the later image to the earlier image grid.
        before, after, valid = align_satellite_images(
            temp_paths[0],
            temp_paths[1],
        )

        # Simple normalized difference across matching bands.
        # This is not a semantic or construction classifier.
        difference = np.zeros(valid.shape, dtype=np.float32)

        for band in range(before.shape[0]):
            a = before[band]
            b = after[band]

            good = valid & np.isfinite(a) & np.isfinite(b)

            if not np.any(good):
                continue

            combined = np.concatenate((a[good], b[good]))
            low, high = np.percentile(combined, [2, 98])
            scale = max(float(high - low), 1e-6)

            a_norm = np.clip((a - low) / scale, 0, 1)
            b_norm = np.clip((b - low) / scale, 0, 1)

            difference[good] += np.abs(
                a_norm[good] - b_norm[good]
            )

        difference[valid] /= before.shape[0]

        values = difference[valid]

        if values.size == 0:
            raise HTTPException(
                status_code=400,
                detail="No overlapping valid pixels were found.",
            )

        # Adaptive threshold for an initial prototype.
        threshold = max(
            0.12,
            float(np.percentile(values, 90)),
        )

        raw_mask = valid & (difference >= threshold)
        change_mask = clean_change_mask(raw_mask)

        stats = calculate_change_statistics(
            change_mask,
            valid,
        )

        return {
            "status": "success",
            "method": "aligned_multiband_difference",
            "analysis": {
                **stats,
                "threshold": round(threshold, 4),
                "change_detected": stats["changed_pixels"] > 0,
            },
            "quality": {
                "alignment": "reprojected_to_before_image_grid",
                "valid_pixels": int(np.count_nonzero(valid)),
                "band_count": int(before.shape[0]),
            },
            "note": (
                "Detected pixels represent spectral or image differences, "
                "not verified real-world changes. Cloud masking and "
                "sensor harmonization are not yet implemented."
            ),
        }

    except HTTPException:
        raise

    except (ValueError, OSError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:
        for path in temp_paths:
            try:
                os.remove(path)
            except OSError:
                pass

@router.post("/analyze-spectral")
async def analyze_spectral(
    file: UploadFile = File(...),
    sensor: str = "sentinel-2",
):
    import os
    import tempfile
    import numpy as np
    import rasterio

    from fastapi import HTTPException

    temp_path = None

    try:
        filename = (file.filename or "").lower()

        if not filename.endswith((".tif", ".tiff")):
            raise HTTPException(
                status_code=400,
                detail="Upload a GeoTIFF file (.tif or .tiff).",
            )

        content = await file.read(MAX_FILE_SIZE + 1)

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Maximum upload size is 100 MB.",
            )

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        with tempfile.NamedTemporaryFile(
            suffix=".tif",
            delete=False,
        ) as temp:
            temp.write(content)
            temp_path = temp.name

        with rasterio.open(temp_path) as src:
            if src.width <= 0 or src.height <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="GeoTIFF dimensions are invalid.",
                )
            if src.width * src.height > MAX_PIXELS:
                raise HTTPException(
                    status_code=413,
                    detail=f"GeoTIFF exceeds the {MAX_PIXELS:,}-pixel limit.",
                )

            image = src.read(
                masked=True,
                out_dtype="float32",
            ).filled(np.nan)

            descriptions = src.descriptions
            scales = src.scales
            offsets = src.offsets

            metadata = {
                "width": src.width,
                "height": src.height,
                "band_count": src.count,
                "crs": str(src.crs) if src.crs else None,
                "resolution": list(src.res),
            }

        bands = identify_bands(descriptions, sensor)

        # Do not guess band positions when metadata is missing.
        if not bands:
            return {
                "status": "incomplete",
                "sensor": sensor,
                "identified_bands": {},
                "metadata": metadata,
                "message": (
                    "No supported spectral bands were identified "
                    "from the GeoTIFF band descriptions. "
                    "Use a product with band names or provide "
                    "an explicit, verified band mapping."
                ),
            }

        # Apply scale and offset only when valid metadata exists.
        for index in range(image.shape[0]):
            scale = scales[index]
            offset = offsets[index]

            if np.isfinite(scale) and np.isfinite(offset):
                image[index] = image[index] * scale + offset

        ndvi_result = None
        ndbi_result = None

        if validate_required_bands(
            bands, ("red", "nir")
        )["valid"]:
            ndvi = calculate_ndvi(image, bands)
            valid_ndvi = np.isfinite(ndvi)

            if np.any(valid_ndvi):
                ndvi_result = {
                    "mean": round(
                        float(np.mean(ndvi[valid_ndvi])), 4
                    ),
                    "median": round(
                        float(np.median(ndvi[valid_ndvi])), 4
                    ),
                    "valid_pixels": int(
                        np.count_nonzero(valid_ndvi)
                    ),
                }

        if validate_required_bands(
            bands, ("swir1", "nir")
        )["valid"]:
            ndbi = calculate_ndbi(image, bands)
            valid_ndbi = np.isfinite(ndbi)

            if np.any(valid_ndbi):
                ndbi_result = {
                    "mean": round(
                        float(np.mean(ndbi[valid_ndbi])), 4
                    ),
                    "valid_pixels": int(
                        np.count_nonzero(valid_ndbi)
                    ),
                }

        quality = estimate_rgb_quality(image, bands)

        return {
            "status": "success",
            "sensor": sensor,
            "identified_bands": bands,
            "metadata": metadata,
            "indices": {
                "ndvi": ndvi_result,
                "ndbi": ndbi_result,
            },
            "quality": quality,
            "note": (
                "Spectral indices are indicators, not proof of "
                "vegetation loss or construction. Confirm the "
                "product's band descriptions, scale factors, "
                "and reflectance units before interpreting results."
            ),
        }

    except HTTPException:
        raise

    except (ValueError, OSError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)




