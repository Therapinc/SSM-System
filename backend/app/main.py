from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from local configuration files strictly, cleanly, and securely
load_dotenv()

from app.api.api import api_router
from app.core.config import settings

app = FastAPI(
    title="Special School Management System",
    description="API for managing special school students, teachers, and resources",
    version="1.0.0"
)

# Configure CORS
if settings.CORS_ORIGINS and settings.CORS_ORIGINS.strip():
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://therapinc.in",
        "https://api.therapinc.in",
        "https://www.therapinc.in",
        "https://therapinc.stmarthasspecialschool.com"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if (settings.CORS_ORIGINS or settings.CORS_ORIGIN_REGEX) else ["*"],
    allow_origin_regex=settings.CORS_ORIGIN_REGEX or r"^https://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API router with the v1 prefix
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def verify_single_worker_compliance():
    import logging
    logger = logging.getLogger(__name__)
    web_concurrency = int(os.environ.get("WEB_CONCURRENCY", 0))
    worker_count = max(settings.WORKERS, web_concurrency)
    
    if worker_count > 1 and not settings.REDIS_URL:
        raise RuntimeError(
            f"Configuration Error: Running with {worker_count} workers is not permitted without a Redis URL. "
            "Process-local rate limiting and daily request tracking will fail to enforce global API limits. "
            "Set WORKERS/WEB_CONCURRENCY=1 or configure REDIS_URL to continue."
        )

    # Automatically sync user accounts for teachers and therapists
    try:
        from app.db.session import SessionLocal
        from app.db.auto_sync_users import sync_users_from_profiles
        db = SessionLocal()
        try:
            sync_users_from_profiles(db, dry_run=False)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to auto-sync user accounts on startup: {e}")

@app.get("/")
@app.head("/")
async def root():
    return {
        "message": "Welcome to Special School Management System API",
        "docs": "/docs",  # Swagger UI
        "redoc": "/redoc"  # ReDoc UI
    } 