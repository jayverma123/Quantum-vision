import numpy as np
import pytest

from app.api.satellite_preprocessing import (
    calculate_valid_mask,
)


def test_valid_mask_excludes_nan_pixels():
    image = np.array(
        [
            [0.2, 0.4],
            [np.nan, 0.8],
        ],
        dtype=np.float32,
    )

    mask = calculate_valid_mask(image)

    assert mask.shape == image.shape
    assert mask[0, 0]
    assert mask[0, 1]
    assert not mask[1, 0]
    assert mask[1, 1]


def test_valid_mask_excludes_infinite_pixels():
    image = np.array(
        [
            [0.2, np.inf],
            [0.5, 0.8],
        ],
        dtype=np.float32,
    )

    mask = calculate_valid_mask(image)

    assert mask[0, 0]
    assert not mask[0, 1]
    assert mask[1, 0]
    assert mask[1, 1]


def test_valid_mask_handles_all_invalid_pixels():
    image = np.array(
        [
            [np.nan, np.inf],
            [-np.inf, np.nan],
        ],
        dtype=np.float32,
    )

    mask = calculate_valid_mask(image)

    assert not np.any(mask)