"""
Intent Model

ERC-8004 compatible agent intents for declarative execution.
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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.agent import Agent


class IntentStatus(str, enum.Enum):
    """Intent lifecycle status."""
    DRAFT = "draft"
    PENDING = "pending"
    VALIDATING = "validating"
    APPROVED = "approved"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class IntentType(str, enum.Enum):
    """Types of agent intents."""
    # Trading intents
    SWAP = "swap"
    LIMIT_ORDER = "limit_order"
    DCA = "dca"  # Dollar cost averaging
    
    # DeFi intents
    YIELD_OPTIMIZE = "yield_optimize"
    REBALANCE = "rebalance"
    STAKE = "stake"
    
    # Data intents
    DATA_FETCH = "data_fetch"
    DATA_ANALYZE = "data_analyze"
    
    # Purchase intents (Reap)
    PURCHASE = "purchase"
    
    # Payment intents (x402)
    PAY_FOR_SERVICE = "pay_for_service"
    
    # Custom
    CUSTOM = "custom"


class Intent(BaseModel):
    """
    Agent Intent (ERC-8004 compatible).
    
    Represents a high-level declarative action that the agent
    wants to execute. Intents are validated, approved, and then
    translated into one or more transactions.
    """
    
    __tablename__ = "intents"
    
    # Intent identity
    intent_type: Mapped[IntentType] = mapped_column(
        Enum(IntentType),
        nullable=False,
        index=True,
    )
    status: Mapped[IntentStatus] = mapped_column(
        Enum(IntentStatus),
        default=IntentStatus.DRAFT,
        nullable=False,
        index=True,
    )
    
    # Agent relationship
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Intent description (natural language)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Structured intent parameters
    parameters: Mapped[dict] = mapped_column(JSON, nullable=False)
    """
    Example parameters by type:
    
    SWAP:
        {
            "from_token": "0x...",
            "to_token": "0x...",
            "amount": "1000000000",
            "slippage_bps": 50,
            "deadline": 1699999999
        }
    
    YIELD_OPTIMIZE:
        {
            "asset": "USDC",
            "min_apy": 5.0,
            "max_risk_score": 3,
            "protocols": ["aave", "benqi"]
        }
    
    PURCHASE (Reap):
        {
            "product_url": "https://amazon.com/...",
            "max_price_usd": 5000,
            "quantity": 1
        }
    
    DATA_FETCH (Turf):
        {
            "query": "ETH price last 24h",
            "sources": ["chainlink", "turf"],
            "max_cost_usd": 10
        }
    """
    
    # Execution constraints
    max_gas_usd: Mapped[int] = mapped_column(
        Integer, default=500, nullable=False
    )  # in cents
    max_slippage_bps: Mapped[int] = mapped_column(
        Integer, default=100, nullable=False
    )  # basis points (100 = 1%)
    deadline_timestamp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Validation results
    validation_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    policy_check_passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Execution results
    execution_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    total_gas_used_usd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_value_usd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    
    # AI reasoning (for audit)
    ai_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="intents")
    
    def __repr__(self) -> str:
        return f"<Intent(type={self.intent_type}, status={self.status})>"
    
    @property
    def is_executable(self) -> bool:
        """Check if intent is ready for execution."""
        return (
            self.status == IntentStatus.APPROVED
            and self.policy_check_passed
            and (self.deadline_timestamp is None or self.deadline_timestamp > 0)
        )
    
    @property
    def can_retry(self) -> bool:
        """Check if intent can be retried."""
        return (
            self.status == IntentStatus.FAILED
            and self.retry_count < self.max_retries
        )
