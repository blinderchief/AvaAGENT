"""
AvaAgent Backend - Main Application

The Agentic Operating System for Avalanche.
"""

import time
from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.core.config import get_settings
from app.core.database import engine, init_db
from app.core.logging import setup_logging
from app.api import (
    agents_router,
    wallets_router,
    payments_router,
    data_router,
    ai_router,
    health_router,
    intents_router,
    commerce_router,
)


settings = get_settings()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    setup_logging()
    logger.info(
        "Starting AvaAgent Backend",
        environment=settings.app_env,
        debug=settings.app_debug,
    )
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AvaAgent Backend")
    await engine.dispose()


app = FastAPI(
    title="AvaAgent API",
    description="""
    **The Agentic Operating System for Avalanche**
    
    AvaAgent provides infrastructure for autonomous AI agents on Avalanche L1s:
    
    - 🤖 **Agent Management** - Create and manage autonomous trading agents
    - 💰 **x402 Payments** - HTTP 402 micropayment protocol integration
    - 🔗 **Multi-Chain** - Avalanche, Kite testnet, and custom L1 support
    - 📊 **Turf Data** - Real-time market data orchestration
    - 🛒 **Reap Commerce** - Real-world purchases with crypto
    - 🧠 **AI Inference** - Gemini-powered decision making
    
    Built for the Avalanche Hack2Build hackathon.
    """,
    version="1.0.0",
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
    openapi_url="/openapi.json" if settings.app_debug else "/api/openapi.json",
    lifespan=lifespan,
)


# ============================================================================
# Middleware
# ============================================================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-payment-required", "x-payment-amount", "x-payment-currency"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next: Callable) -> Response:
    """Log all requests with timing."""
    start_time = time.time()
    
    # Generate request ID
    request_id = request.headers.get("x-request-id", str(time.time()))
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Log request
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
        request_id=request_id,
    )
    
    # Add headers
    response.headers["x-request-id"] = request_id
    response.headers["x-response-time"] = f"{round(duration_ms, 2)}ms"
    
    return response


@app.middleware("http")
async def error_handling_middleware(
    request: Request,
    call_next: Callable,
) -> Response:
    """Global error handling."""
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception(
            "Unhandled exception",
            error=str(e),
            path=request.url.path,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(e) if settings.app_debug else "An unexpected error occurred",
            },
        )


# ============================================================================
# Routers
# ============================================================================

# API v1 routes
api_v1_prefix = "/api/v1"

# Health checks (no auth required)
app.include_router(health_router, prefix=api_v1_prefix)

app.include_router(agents_router, prefix=api_v1_prefix)
app.include_router(wallets_router, prefix=api_v1_prefix)
app.include_router(payments_router, prefix=api_v1_prefix)
app.include_router(intents_router, prefix=api_v1_prefix)
app.include_router(data_router, prefix=api_v1_prefix)
app.include_router(ai_router, prefix=api_v1_prefix)
app.include_router(commerce_router, prefix=api_v1_prefix)


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "AvaAgent API",
        "version": "1.0.0",
        "description": "The Agentic Operating System for Avalanche",
        "docs": "/docs" if settings.app_debug else None,
        "health": "/api/v1/health",
        "api": {
            "v1": api_v1_prefix,
        },
        "links": {
            "github": "https://github.com/avaagent",
            "docs": "https://docs.avaagent.ai",
        },
    }


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not found",
            "detail": f"The requested resource '{request.url.path}' was not found",
        },
    )


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc):
    """Custom validation error handler."""
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation error",
            "detail": exc.errors() if hasattr(exc, "errors") else str(exc),
        },
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.app_debug,
        log_level="debug" if settings.app_debug else "info",
    )
