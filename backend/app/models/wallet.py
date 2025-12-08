"""
Agent Wallet Model

ERC-4337 compatible smart wallet with programmable policies.
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
    Numeric,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.agent import Agent


class WalletType(str, enum.Enum):
    """Types of agent wallets."""
    ERC4337 = "erc4337"  # Account Abstraction
    EOA = "eoa"  # Externally Owned Account
    MULTISIG = "multisig"
    KITE_HIERARCHICAL = "kite_hierarchical"  # Kite 3-tier identity


class ChainNetwork(str, enum.Enum):
    """Supported blockchain networks."""
    AVALANCHE_MAINNET = "avalanche_mainnet"
    AVALANCHE_FUJI = "avalanche_fuji"
    KITE_TESTNET = "kite_testnet"
    KITE_MAINNET = "kite_mainnet"


class AgentWallet(BaseModel):
    """
    Agent's on-chain wallet.
    
    Supports ERC-4337 Account Abstraction with programmable
    spending limits and policy enforcement.
    """
    
    __tablename__ = "agent_wallets"
    
    # Wallet Identity
    address: Mapped[str] = mapped_column(
        String(42), nullable=False, unique=True, index=True
    )
    wallet_type: Mapped[WalletType] = mapped_column(
        Enum(WalletType),
        default=WalletType.ERC4337,
        nullable=False,
    )
    chain_network: Mapped[ChainNetwork] = mapped_column(
        Enum(ChainNetwork),
        default=ChainNetwork.AVALANCHE_FUJI,
        nullable=False,
    )
    
    # Owner Agent
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Wallet metadata
    label: Mapped[str] = mapped_column(String(100), default="Primary", nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Balance tracking (cached, updated periodically)
    native_balance_wei: Mapped[str] = mapped_column(
        String(78), default="0", nullable=False  # uint256 max length
    )
    usdc_balance_wei: Mapped[str] = mapped_column(
        String(78), default="0", nullable=False
    )
    
    # Guardian configuration (for ERC-4337)
    guardian_address: Mapped[Optional[str]] = mapped_column(String(42), nullable=True)
    recovery_address: Mapped[Optional[str]] = mapped_column(String(42), nullable=True)
    
    # Session keys (for Kite hierarchical identity)
    session_key_config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="wallets")
    policies: Mapped[list["WalletPolicy"]] = relationship(
        "WalletPolicy",
        back_populates="wallet",
        cascade="all, delete-orphan",
    )
    spend_limits: Mapped[list["SpendLimit"]] = relationship(
        "SpendLimit",
        back_populates="wallet",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<AgentWallet(address={self.address}, type={self.wallet_type})>"


class PolicyType(str, enum.Enum):
    """Types of wallet policies."""
    ALLOWLIST = "allowlist"  # Only allowed addresses
    BLOCKLIST = "blocklist"  # Blocked addresses
    CONTRACT_CALL = "contract_call"  # Specific contract interactions
    TIME_BASED = "time_based"  # Time-restricted operations
    CONDITION = "condition"  # Custom conditions (e.g., volatility < X)


class WalletPolicy(BaseModel):
    """
    Programmable policy for agent wallet.
    
    Defines guardrails and constraints for agent operations.
    """
    
    __tablename__ = "wallet_policies"
    
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_wallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    policy_type: Mapped[PolicyType] = mapped_column(
        Enum(PolicyType),
        nullable=False,
    )
    
    # Policy configuration
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    """
    Config examples:
    - allowlist: {"addresses": ["0x...", "0x..."]}
    - contract_call: {"contract": "0x...", "methods": ["swap", "transfer"]}
    - time_based: {"allowed_hours": [9, 17], "allowed_days": [1, 2, 3, 4, 5]}
    - condition: {"oracle": "turf", "metric": "volatility", "operator": "<", "value": 0.05}
    """
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    wallet: Mapped["AgentWallet"] = relationship("AgentWallet", back_populates="policies")
    
    def __repr__(self) -> str:
        return f"<WalletPolicy(name={self.name}, type={self.policy_type})>"


class SpendLimitPeriod(str, enum.Enum):
    """Spend limit time periods."""
    PER_TRANSACTION = "per_transaction"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class SpendLimit(BaseModel):
    """
    Spending limit configuration for agent wallet.
    
    Enforces maximum spend amounts per period.
    """
    
    __tablename__ = "spend_limits"
    
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_wallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Limit configuration
    period: Mapped[SpendLimitPeriod] = mapped_column(
        Enum(SpendLimitPeriod),
        nullable=False,
    )
    max_amount_usd: Mapped[int] = mapped_column(
        Integer, nullable=False  # in cents (e.g., 50000 = $500)
    )
    
    # Token-specific limits (optional)
    token_address: Mapped[Optional[str]] = mapped_column(
        String(42), nullable=True
    )  # None = all tokens
    
    # Current period tracking
    current_spent_usd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    period_start_timestamp: Mapped[int] = mapped_column(Integer, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    wallet: Mapped["AgentWallet"] = relationship("AgentWallet", back_populates="spend_limits")
    
    def __repr__(self) -> str:
        return f"<SpendLimit(period={self.period}, max=${self.max_amount_usd/100})>"
    
    @property
    def remaining_usd(self) -> int:
        """Get remaining spend amount in cents."""
        return max(0, self.max_amount_usd - self.current_spent_usd)
    
    @property
    def is_exceeded(self) -> bool:
        """Check if limit is exceeded."""
        return self.current_spent_usd >= self.max_amount_usd
