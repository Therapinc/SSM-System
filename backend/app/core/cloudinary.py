from functools import lru_cache

import cloudinary
import cloudinary.uploader

from app.core.config import settings


@lru_cache(maxsize=1)
def init_cloudinary() -> None:
    """Initialize Cloudinary once from application settings."""
    if not (
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    ):
        raise RuntimeError(
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
        )

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def get_cloudinary_folder(*parts: str) -> str:
    """Build an environment-scoped Cloudinary folder path."""
    environment = (settings.APP_ENV or "development").strip().lower()
    prefix = "ssms" if environment in {"prod", "production"} else "ssms-dev"
    clean_parts = [part.strip("/ ") for part in parts if part and part.strip("/ ")]
    return "/".join([prefix, *clean_parts]) if clean_parts else prefix


def upload_image(
    file_bytes: bytes,
    *,
    folder: str,
    public_id: str,
    overwrite: bool = True,
) -> dict:
    """Upload an image to Cloudinary and return the API response."""
    init_cloudinary()
    return cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=public_id,
        overwrite=overwrite,
        unique_filename=False,
        use_filename=False,
        resource_type="image",
    )


def delete_image(public_id: str) -> dict:
    """Delete an uploaded Cloudinary image by public_id."""
    init_cloudinary()
    return cloudinary.uploader.destroy(public_id, resource_type="image")
