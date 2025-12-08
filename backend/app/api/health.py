"""
Health Check API Routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db

router = APIRouter(tags=["Health"])

settings = get_settings()


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "avaagent-backend",
        "version": "1.0.0",
    }


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Readiness check including database connectivity.
    
    Returns 200 if all dependencies are ready.
    """
    checks = {
        "database": False,
    }
    
    # Check database
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass
    
    all_healthy = all(checks.values())
    
    return {
        "status": "ready" if all_healthy else "not_ready",
        "checks": checks,
    }


@router.get("/health/live")
async def liveness_check():
    """
    Liveness check for container orchestration.
    
    Always returns 200 if the service is running.
    """
    return {"status": "alive"}


@router.get("/info")
async def service_info():
    """Get service information."""
    return {
        "name": "AvaAgent Backend",
        "version": "1.0.0",
        "description": "The Agentic Operating System for Avalanche",
        "environment": settings.app_env,
        "features": {
            "x402_payments": True,
            "ai_inference": True,
            "multi_chain": True,
            "agent_wallets": True,
            "turf_integration": True,
            "reap_integration": True,
        },
        "networks": [
            "avalanche",
            "avalanche_fuji",
            "kite_testnet",
        ],
    }
