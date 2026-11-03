import os
import rasterio


def inspect_geotiff(file_path: str):
    """
    Read basic geospatial information from a GeoTIFF.
    """

    with rasterio.open(file_path) as dataset:

        return {
            "driver": dataset.driver,
            "width": dataset.width,
            "height": dataset.height,
            "bands": dataset.count,
            "crs": str(dataset.crs),
            "resolution": dataset.res,
            "bounds": {
                "left": dataset.bounds.left,
                "bottom": dataset.bounds.bottom,
                "right": dataset.bounds.right,
                "top": dataset.bounds.top,
            },
            "nodata": dataset.nodata,
            "dtype": dataset.dtypes[0],
        }


def scan_satellite_data(folder_path: str):

    if not os.path.exists(folder_path):
        return {
            "status": "error",
            "message": "Satellite data folder not found."
        }

    tiff_files = []

    for root, dirs, files in os.walk(folder_path):

        for file in files:

            if file.lower().endswith(
                (".tif", ".tiff")
            ):

                file_path = os.path.join(
                    root,
                    file
                )

                try:

                    metadata = inspect_geotiff(
                        file_path
                    )

                    tiff_files.append({
                        "filename": file,
                        "path": file_path,
                        "metadata": metadata
                    })

                except Exception as error:

                    tiff_files.append({
                        "filename": file,
                        "path": file_path,
                        "status": "error",
                        "message": str(error)
                    })

    return {
        "status": "success",
        "tiff_files": tiff_files,
        "tiff_count": len(tiff_files)
    }


def scan_sentinel_safe(folder_path: str):

    if not os.path.exists(folder_path):
        return {
            "status": "error",
            "message": "Satellite data folder not found."
        }

    safe_products = []

    for item in os.listdir(folder_path):

        if item.upper().endswith(".SAFE"):

            safe_path = os.path.join(
                folder_path,
                item
            )

            jp2_files = []

            for root, dirs, files in os.walk(safe_path):

                for file in files:

                    if file.lower().endswith(".jp2"):

                        jp2_files.append(
                            os.path.join(
                                root,
                                file
                            )
                        )

            safe_products.append({
                "product": item,
                "path": safe_path,
                "jp2_files": jp2_files,
                "jp2_count": len(jp2_files)
            })

    return {
        "status": "success",
        "products": safe_products,
        "product_count": len(safe_products)
    }