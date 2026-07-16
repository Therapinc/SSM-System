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
        "http://localhost:3000",  # React frontend
        "http://localhost:5173",
        "https://therapinc.stmarthasspecialschool.com"  # Vite frontend (if using Vite)
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
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

@app.get("/")
@app.head("/")
async def root():
    return {
        "message": "Welcome to Special School Management System API",
        "docs": "/docs",  # Swagger UI
        "redoc": "/redoc"  # ReDoc UI
    } 