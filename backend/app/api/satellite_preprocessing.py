
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling
from scipy.ndimage import binary_opening, binary_closing
from scipy.ndimage import median_filter


def load_satellite(path):
    """Load a multiband GeoTIFF and its geospatial metadata."""

    with rasterio.open(path) as src:
        image = src.read(masked=True).astype(np.float32).filled(np.nan)

        return {
            "image": image,
            "crs": src.crs,
            "transform": src.transform,
            "width": src.width,
            "height": src.height,
            "count": src.count,
            "descriptions": src.descriptions,
            "bounds": src.bounds,
            "nodata": src.nodata,
            "scales": src.scales,
            "offsets": src.offsets,
            "resolution": src.res,
        }


def align_satellite_images(before_path, after_path):
    """
    Reproject the AFTER image onto the BEFORE image grid.
    Returns aligned arrays and a validity mask.
    """
    max_pixels = 10_000_000

    with rasterio.open(before_path) as before_src, \
         rasterio.open(after_path) as after_src:

        if before_src.width * before_src.height > max_pixels:
            raise ValueError(
                f"The before GeoTIFF exceeds the {max_pixels:,}-pixel limit."
            )
        if after_src.width * after_src.height > max_pixels:
            raise ValueError(
                f"The after GeoTIFF exceeds the {max_pixels:,}-pixel limit."
            )

        if before_src.crs is None or after_src.crs is None:
            raise ValueError(
                "Both satellite images must have a valid CRS."
            )

        if before_src.count != after_src.count:
            raise ValueError(
                "Images have different band counts. "
                "Match corresponding spectral bands before comparison."
            )

        before = before_src.read(masked=True).astype(
            np.float32
        ).filled(np.nan)

        after = np.full(
            (
                after_src.count,
                before_src.height,
                before_src.width,
            ),
            np.nan,
            dtype=np.float32,
        )

        for band in range(1, after_src.count + 1):
            reproject(
                source=rasterio.band(after_src, band),
                destination=after[band - 1],
                src_transform=after_src.transform,
                src_crs=after_src.crs,
                dst_transform=before_src.transform,
                dst_crs=before_src.crs,
                src_nodata=after_src.nodata,
                dst_nodata=np.nan,
                resampling=Resampling.bilinear,
            )

        before_valid = np.all(np.isfinite(before), axis=0)
        after_valid = np.all(np.isfinite(after), axis=0)

        valid = before_valid & after_valid

        if not np.any(valid):
            raise ValueError(
                "The images have no overlapping valid pixels."
            )

        return before, after, valid


def estimate_cloud_brightness(image, valid_mask=None,
                              percentile=90):
    """
    Estimate unusually bright pixels for RGB-like imagery.

    This is a basic brightness heuristic, NOT a validated
    satellite cloud detector.
    """

    if image.ndim != 3 or image.shape[0] < 3:
        raise ValueError("At least three image bands are required.")

    rgb = image[:3]
    valid = np.all(np.isfinite(rgb), axis=0)

    if valid_mask is not None:
        valid &= valid_mask

    if not np.any(valid):
        return np.zeros(valid.shape, dtype=bool)

    brightness = np.nanmean(rgb, axis=0)
    cutoff = np.nanpercentile(brightness[valid], percentile)

    cloud_candidates = valid & (brightness >= cutoff)

    return binary_opening(cloud_candidates)


def clean_change_mask(mask, size=3):
    """Remove isolated pixels and smooth small mask gaps."""

    mask = np.asarray(mask, dtype=bool)

    if size < 1 or size % 2 == 0:
        raise ValueError("size must be a positive odd number.")

    mask = median_filter(
        mask.astype(np.uint8),
        size=size,
    ).astype(bool)

    mask = binary_opening(mask)
    mask = binary_closing(mask)

    return mask


def calculate_change_statistics(change_mask, valid_mask):
    """Calculate image-based change statistics."""

    valid = np.asarray(valid_mask, dtype=bool)
    changed = np.asarray(change_mask, dtype=bool) & valid

    total_pixels = int(np.count_nonzero(valid))
    changed_pixels = int(np.count_nonzero(changed))

    percentage = (
        100.0 * changed_pixels / total_pixels
        if total_pixels else 0.0
    )

    return {
        "changed_pixels": changed_pixels,
        "total_valid_pixels": total_pixels,
        "change_percentage": round(percentage, 4),
    }
def calculate_valid_mask(image):
    import numpy as np

    image = np.asarray(image)
    return np.isfinite(image)

