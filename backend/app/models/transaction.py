"""
Transaction Model

Records all on-chain transactions made by agents.
"""

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
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
from app.models.wallet import ChainNetwork

if TYPE_CHECKING:
    from app.models.agent import Agent


class TransactionStatus(str, enum.Enum):
    """Transaction lifecycle status."""
    PENDING = "pending"
    SIMULATING = "simulating"
    SIGNING = "signing"
    SUBMITTED = "submitted"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    REVERTED = "reverted"
    CANCELLED = "cancelled"


class TransactionType(str, enum.Enum):
    """Types of transactions."""
    # Standard transfers
    NATIVE_TRANSFER = "native_transfer"
    TOKEN_TRANSFER = "token_transfer"
    
    # DeFi operations
    SWAP = "swap"
    ADD_LIQUIDITY = "add_liquidity"
    REMOVE_LIQUIDITY = "remove_liquidity"
    STAKE = "stake"
    UNSTAKE = "unstake"
    CLAIM_REWARDS = "claim_rewards"
    
    # Agent operations
    WALLET_DEPLOY = "wallet_deploy"
    POLICY_UPDATE = "policy_update"
    
    # x402 payments
    X402_PAYMENT = "x402_payment"
    X402_SETTLEMENT = "x402_settlement"
    
    # Reap purchases
    REAP_PURCHASE = "reap_purchase"
    REAP_SETTLEMENT = "reap_settlement"
    
    # Data marketplace
    DATA_PURCHASE = "data_purchase"
    
    # Contract interactions
    CONTRACT_CALL = "contract_call"
    CONTRACT_DEPLOY = "contract_deploy"


class Transaction(BaseModel):
    """
    On-chain transaction record.
    
    Tracks all transactions made by agents with full audit trail.
    """
    
    __tablename__ = "transactions"
    
    # Transaction identity
    tx_hash: Mapped[Optional[str]] = mapped_column(
        String(66), nullable=True, unique=True, index=True
    )
    chain_network: Mapped[ChainNetwork] = mapped_column(
        Enum(ChainNetwork),
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
    wallet_address: Mapped[str] = mapped_column(
        String(42), nullable=False, index=True
    )
    
    # Transaction details
    tx_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType),
        nullable=False,
        index=True,
    )
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus),
        default=TransactionStatus.PENDING,
        nullable=False,
        index=True,
    )
    
    # Addresses
    from_address: Mapped[str] = mapped_column(String(42), nullable=False)
    to_address: Mapped[Optional[str]] = mapped_column(String(42), nullable=True)
    
    # Value
    value_wei: Mapped[str] = mapped_column(
        String(78), default="0", nullable=False
    )
    value_usd: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )  # in cents
    
    # Gas
    gas_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gas_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gas_price_wei: Mapped[Optional[str]] = mapped_column(String(78), nullable=True)
    gas_cost_usd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Block info
    block_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    block_timestamp: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Transaction data
    input_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decoded_input: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Intent reference (if from an intent)
    intent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("intents.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revert_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Transaction metadata
    tx_metadata: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="transactions")
    
    def __repr__(self) -> str:
        return f"<Transaction(hash={self.tx_hash}, type={self.tx_type}, status={self.status})>"
    
    @property
    def explorer_url(self) -> Optional[str]:
        """Get block explorer URL for this transaction."""
        if not self.tx_hash:
            return None
        
        explorers = {
            ChainNetwork.AVALANCHE_MAINNET: "https://snowtrace.io/tx",
            ChainNetwork.AVALANCHE_FUJI: "https://testnet.snowtrace.io/tx",
            ChainNetwork.KITE_TESTNET: "https://testnet.kitescan.ai/tx",
        }
        
        base_url = explorers.get(self.chain_network)
        return f"{base_url}/{self.tx_hash}" if base_url else None
