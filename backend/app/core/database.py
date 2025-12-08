"""
Neon PostgreSQL Database Configuration

Async database connection using SQLAlchemy 2.0 with asyncpg driver.
Optimized for Neon's serverless PostgreSQL with connection pooling.
"""

import ssl
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def _clean_database_url(url: str) -> str:
    """Remove sslmode from URL as asyncpg handles it differently."""
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    # Remove params that asyncpg doesn't recognize
    query_params.pop('sslmode', None)
    query_params.pop('channel_binding', None)
    new_query = urlencode(query_params, doseq=True)
    cleaned = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        new_query,
        parsed.fragment
    ))
    return cleaned


def create_engine() -> AsyncEngine:
    """
    Create async database engine optimized for Neon serverless.
    
    Uses NullPool for serverless environments to avoid connection issues.
    """
    # Clean the URL to remove sslmode (asyncpg uses ssl context instead)
    db_url = _clean_database_url(str(settings.database_url))
    
    # Create SSL context for secure connection
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    # For serverless (Neon), use NullPool to create fresh connections
    # This works better with Neon's connection pooling
    engine = create_async_engine(
        db_url,
        echo=settings.app_debug,
        poolclass=NullPool,  # Neon handles pooling
        connect_args={
            "ssl": ssl_context,
            "server_settings": {
                "application_name": "avaagent",
                "statement_timeout": "30000",  # 30 seconds
            },
        },
    )
    return engine


# Create global engine instance
engine = create_engine()

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager for database sessions.
    
    Usage:
        async with get_db_session() as session:
            result = await session.execute(query)
    """
    session = async_session_maker()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI endpoints to get database session.
    
    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with get_db_session() as session:
        yield session


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()
