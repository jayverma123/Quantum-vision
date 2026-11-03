
import numpy as np


def generate_change_quality_report(
    difference,
    change_mask,
    valid_mask,
    threshold,
):
    difference = np.asarray(difference, dtype=np.float32)
    change_mask = np.asarray(change_mask, dtype=bool)
    valid_mask = np.asarray(valid_mask, dtype=bool)

    if (
        difference.shape != change_mask.shape
        or difference.shape != valid_mask.shape
    ):
        raise ValueError(
            "Difference, change mask, and valid mask "
            "must have the same shape."
        )

    valid = valid_mask & np.isfinite(difference)

    total_pixels = int(valid.size)
    valid_pixels = int(np.count_nonzero(valid))
    invalid_pixels = total_pixels - valid_pixels

    if total_pixels == 0 or valid_pixels == 0:
        return {
            "status": "unavailable",
            "reason": "No valid pixels are available.",
        }

    valid_differences = difference[valid]
    changed = change_mask & valid
    changed_pixels = int(np.count_nonzero(changed))

    valid_coverage = valid_pixels / total_pixels * 100
    change_percentage = changed_pixels / valid_pixels * 100

    if valid_coverage < 80:
        quality_label = "limited_valid_coverage"
        recommendation = (
            "Review invalid areas and image quality before "
            "interpreting the comparison."
        )
    elif changed_pixels == 0:
        quality_label = "no_changes_above_threshold"
        recommendation = (
            "No pixels exceeded the configured change threshold. "
            "This does not prove that no real-world change occurred."
        )
    else:
        quality_label = "comparison_completed"
        recommendation = (
            "Review the change overlay and verify possible changes "
            "against the original images."
        )

    return {
        "status": "available",
        "quality_label": quality_label,
        "total_pixels": total_pixels,
        "valid_pixels": valid_pixels,
        "invalid_pixels": invalid_pixels,
        "valid_coverage_percentage": round(valid_coverage, 2),
        "changed_pixels": changed_pixels,
        "change_percentage": round(change_percentage, 4),
        "threshold": float(threshold),
        "mean_difference": round(
            float(np.mean(valid_differences)), 5
        ),
        "median_difference": round(
            float(np.median(valid_differences)), 5
        ),
        "p95_difference": round(
            float(np.percentile(valid_differences, 95)), 5
        ),
        "recommendation": recommendation,
        "interpretation": (
            "These metrics describe image differences. "
            "They are not a probability of real-world change."
        ),
    }

