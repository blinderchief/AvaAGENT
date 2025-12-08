"""
AvaAgent Backend Test Configuration
"""

import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.core.database import get_db
from app.core.config import settings


# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
    )
    
    # Create tables
    from app.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database session override."""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
def mock_clerk_auth():
    """Mock Clerk authentication."""
    mock = MagicMock()
    mock.verify_token = AsyncMock(return_value={
        "sub": "test_user_id",
        "email": "test@example.com",
    })
    return mock


@pytest.fixture
def mock_gemini():
    """Mock Gemini AI client."""
    mock = MagicMock()
    mock.generate_content = AsyncMock(return_value=MagicMock(
        text="This is a test response from Gemini.",
        usage_metadata=MagicMock(
            prompt_token_count=10,
            candidates_token_count=20,
        ),
    ))
    return mock


@pytest.fixture
def mock_web3():
    """Mock Web3 client."""
    mock = MagicMock()
    mock.eth.get_balance = AsyncMock(return_value=1000000000000000000)  # 1 ETH
    mock.eth.send_transaction = AsyncMock(return_value="0x" + "a" * 64)
    mock.eth.get_transaction_receipt = AsyncMock(return_value={
        "status": 1,
        "transactionHash": "0x" + "a" * 64,
    })
    return mock


# Test data fixtures
@pytest.fixture
def test_user_data():
    """Sample user data for tests."""
    return {
        "clerk_id": "test_clerk_id",
        "email": "test@example.com",
        "name": "Test User",
    }


@pytest.fixture
def test_agent_data():
    """Sample agent data for tests."""
    return {
        "name": "Test Trading Agent",
        "description": "A test agent for automated trading",
        "agent_type": "trading",
        "capabilities": ["swap_tokens", "monitor_prices"],
        "config": {
            "max_transactions": 100,
            "risk_level": "medium",
        },
    }


@pytest.fixture
def test_wallet_data():
    """Sample wallet data for tests."""
    return {
        "name": "Test Wallet",
        "network": "avalanche_fuji",
        "wallet_type": "eoa",
    }


@pytest.fixture
def test_intent_data():
    """Sample intent data for tests."""
    return {
        "raw_input": "Swap 100 AVAX for USDC",
        "intent_type": "swap",
        "parsed_data": {
            "action": "swap",
            "from_token": "AVAX",
            "to_token": "USDC",
            "amount": "100",
        },
    }


# Auth header fixture
@pytest.fixture
def auth_headers():
    """Generate authorization headers for authenticated requests."""
    return {"Authorization": "Bearer test_token"}
