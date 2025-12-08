"""
Agent Model

Represents an AI agent in the AvaAgent ecosystem.
"""

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Enum, ForeignKey, Integer, String, Text, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.wallet import AgentWallet
    from app.models.transaction import Transaction
    from app.models.intent import Intent


class AgentStatus(str, enum.Enum):
    """Agent operational status."""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"


class AgentType(str, enum.Enum):
    """Types of AI agents."""
    TRADING = "trading"
    TREASURY = "treasury"
    DATA_ANALYST = "data_analyst"
    PURCHASING = "purchasing"
    DEFI = "defi"
    CUSTOM = "custom"


class Agent(BaseModel):
    """
    AI Agent entity.
    
    Represents an autonomous AI agent with its own identity,
    wallet, and execution policies on the Avalanche network.
    """
    
    __tablename__ = "agents"
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    agent_type: Mapped[AgentType] = mapped_column(
        Enum(AgentType),
        default=AgentType.CUSTOM,
        nullable=False,
    )
    status: Mapped[AgentStatus] = mapped_column(
        Enum(AgentStatus),
        default=AgentStatus.DRAFT,
        nullable=False,
        index=True,
    )
    
    # Owner relationship (Clerk user ID)
    owner_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    # Agent Identity (on-chain)
    kite_identity_address: Mapped[Optional[str]] = mapped_column(
        String(42), nullable=True, unique=True
    )
    youmio_agent_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    
    # Configuration
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    capabilities: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    
    # AI Model Configuration
    ai_model: Mapped[str] = mapped_column(
        String(100), default="gemini-1.5-pro", nullable=False
    )
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Reputation & Metrics
    reputation_score: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    total_transactions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_volume_usd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # in cents
    success_rate: Mapped[int] = mapped_column(Integer, default=100, nullable=False)  # percentage * 100
    
    # Feature flags
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_trade: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_purchase: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_access_data: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    wallets: Mapped[list["AgentWallet"]] = relationship(
        "AgentWallet",
        back_populates="agent",
        cascade="all, delete-orphan",
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="agent",
        cascade="all, delete-orphan",
    )
    intents: Mapped[list["Intent"]] = relationship(
        "Intent",
        back_populates="agent",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Agent(id={self.id}, name={self.name}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        return self.status == AgentStatus.ACTIVE
    
    @property
    def primary_wallet(self) -> Optional["AgentWallet"]:
        """Get the primary wallet for this agent."""
        for wallet in self.wallets:
            if wallet.is_primary:
                return wallet
        return self.wallets[0] if self.wallets else None
