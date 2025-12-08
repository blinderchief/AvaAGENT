"""
Data Request Model

Tracks data requests and sources from Turf and other providers.
"""

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class DataSourceType(str, enum.Enum):
    """Types of data sources."""
    TURF = "turf"
    CHAINLINK = "chainlink"
    AVALANCHE_DATA_API = "avalanche_data_api"
    KITE_AI = "kite_ai"
    EXTERNAL_API = "external_api"


class DataRequestStatus(str, enum.Enum):
    """Data request status."""
    PENDING = "pending"
    FETCHING = "fetching"
    COMPLETED = "completed"
    FAILED = "failed"
    CACHED = "cached"


class DataSource(BaseModel):
    """
    Registered data source/provider.
    
    Represents a data provider in the Turf ecosystem or external oracles.
    """
    
    __tablename__ = "data_sources"
    
    # Source identity
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    source_type: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType),
        nullable=False,
        index=True,
    )
    
    # Provider details
    provider_address: Mapped[Optional[str]] = mapped_column(String(42), nullable=True)
    api_endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Capabilities
    supported_data_types: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    """
    Example: ["price", "volume", "market_cap", "social_sentiment"]
    """
    
    # Pricing
    price_per_request_usd: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )  # in hundredths of cents (e.g., 100 = $0.001)
    
    # Quality metrics
    reliability_score: Mapped[int] = mapped_column(
        Integer, default=100, nullable=False
    )  # 0-100
    avg_latency_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Configuration
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    def __repr__(self) -> str:
        return f"<DataSource(name={self.name}, type={self.source_type})>"


class DataRequest(BaseModel):
    """
    Data request from an agent.
    
    Tracks data queries made to Turf and other data providers,
    including costs and results.
    """
    
    __tablename__ = "data_requests"
    
    # Request identity
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("data_sources.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Request details
    query: Mapped[str] = mapped_column(Text, nullable=False)
    query_type: Mapped[str] = mapped_column(String(50), nullable=False)
    """
    Example types: "price", "historical", "sentiment", "on_chain_metrics"
    """
    
    parameters: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    """
    Example:
    {
        "asset": "AVAX",
        "timeframe": "1h",
        "limit": 100
    }
    """
    
    # Status
    status: Mapped[DataRequestStatus] = mapped_column(
        Enum(DataRequestStatus),
        default=DataRequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    
    # Result
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result_hash: Mapped[Optional[str]] = mapped_column(
        String(66), nullable=True
    )  # For verification
    
    # Cost tracking
    cost_usd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # in cents
    payment_tx_hash: Mapped[Optional[str]] = mapped_column(String(66), nullable=True)
    
    # Performance
    latency_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Caching
    cache_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cache_expires_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Error
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Attribution (for Kite PoAI)
    attribution_proof: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    def __repr__(self) -> str:
        return f"<DataRequest(query={self.query[:50]}, status={self.status})>"
