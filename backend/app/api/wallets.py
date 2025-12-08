"""
Wallet API Routes

ERC-4337 wallet management endpoints.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ClerkUser, get_current_user
from app.models.wallet import (
    WalletType,
    ChainNetwork,
    PolicyType,
    SpendLimitPeriod,
)
from app.services.agent_service import AgentService
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/wallets", tags=["Wallets"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class WalletCreate(BaseModel):
    """Schema for creating a wallet."""
    agent_id: str
    label: str = Field(default="Primary", max_length=100)
    wallet_type: WalletType = WalletType.ERC4337
    chain_network: ChainNetwork = ChainNetwork.AVALANCHE_FUJI
    is_primary: bool = False


class WalletResponse(BaseModel):
    """Schema for wallet response."""
    id: str
    address: str
    wallet_type: str
    chain_network: str
    agent_id: str
    label: str
    is_primary: bool
    is_active: bool
    native_balance_wei: str
    usdc_balance_wei: str
    created_at: str

    class Config:
        from_attributes = True


class PolicyCreate(BaseModel):
    """Schema for creating a policy."""
    name: str = Field(..., max_length=100)
    policy_type: PolicyType
    config: dict
    description: Optional[str] = None
    priority: int = 0


class PolicyResponse(BaseModel):
    """Schema for policy response."""
    id: str
    name: str
    policy_type: str
    config: dict
    description: Optional[str]
    priority: int
    is_active: bool


class SpendLimitUpdate(BaseModel):
    """Schema for updating spend limit."""
    period: SpendLimitPeriod
    max_amount_usd: float = Field(..., ge=0)


class SpendLimitResponse(BaseModel):
    """Schema for spend limit response."""
    id: str
    period: str
    max_amount_usd: float
    current_spent_usd: float
    remaining_usd: float
    is_active: bool


class BalanceResponse(BaseModel):
    """Schema for balance response."""
    network: str
    address: str
    native: dict
    usdc: Optional[dict] = None


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("", response_model=WalletResponse, status_code=status.HTTP_201_CREATED)
async def create_wallet(
    data: WalletCreate,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new wallet for an agent."""
    agent_service = AgentService(db)
    wallet_service = WalletService(db)
    
    # Verify agent ownership
    agent = await agent_service.get_agent(
        uuid.UUID(data.agent_id),
        owner_id=user.id,
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    wallet = await wallet_service.create_wallet(
        agent_id=agent.id,
        label=data.label,
        wallet_type=data.wallet_type,
        chain_network=data.chain_network,
        is_primary=data.is_primary,
    )
    
    await db.commit()
    
    return _wallet_to_response(wallet)


@router.get("/{wallet_id}", response_model=WalletResponse)
async def get_wallet(
    wallet_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get wallet details."""
    wallet_service = WalletService(db)
    agent_service = AgentService(db)
    
    wallet = await wallet_service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Verify ownership
    agent = await agent_service.get_agent(wallet.agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return _wallet_to_response(wallet)


@router.get("/{wallet_id}/balance", response_model=BalanceResponse)
async def get_wallet_balance(
    wallet_id: uuid.UUID,
    sync: bool = Query(False, description="Sync from blockchain"),
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get wallet balance."""
    wallet_service = WalletService(db)
    agent_service = AgentService(db)
    
    wallet = await wallet_service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Verify ownership
    agent = await agent_service.get_agent(wallet.agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Optionally sync from blockchain
    if sync:
        wallet = await wallet_service.sync_balances(wallet_id)
        await db.commit()
    
    from app.services.blockchain_service import get_blockchain_service
    blockchain = get_blockchain_service()
    
    network = wallet.chain_network.value
    balance = await blockchain.get_balance(wallet.address, network=network)
    
    return BalanceResponse(**balance)


@router.post("/{wallet_id}/policies", response_model=PolicyResponse)
async def add_policy(
    wallet_id: uuid.UUID,
    data: PolicyCreate,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a policy to a wallet."""
    wallet_service = WalletService(db)
    agent_service = AgentService(db)
    
    wallet = await wallet_service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Verify ownership
    agent = await agent_service.get_agent(wallet.agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")
    
    policy = await wallet_service.add_policy(
        wallet_id=wallet_id,
        name=data.name,
        policy_type=data.policy_type,
        config=data.config,
        description=data.description,
        priority=data.priority,
    )
    
    await db.commit()
    
    return PolicyResponse(
        id=str(policy.id),
        name=policy.name,
        policy_type=policy.policy_type.value,
        config=policy.config,
        description=policy.description,
        priority=policy.priority,
        is_active=policy.is_active,
    )


@router.get("/{wallet_id}/policies", response_model=list[PolicyResponse])
async def list_policies(
    wallet_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List policies for a wallet."""
    wallet_service = WalletService(db)
    agent_service = AgentService(db)
    
    wallet = await wallet_service.get_wallet(wallet_id, include_policies=True)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Verify ownership
    agent = await agent_service.get_agent(wallet.agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return [
        PolicyResponse(
            id=str(p.id),
            name=p.name,
            policy_type=p.policy_type.value,
            config=p.config,
            description=p.description,
            priority=p.priority,
            is_active=p.is_active,
        )
        for p in wallet.policies
    ]


@router.delete("/{wallet_id}/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_policy(
    wallet_id: uuid.UUID,
    policy_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a policy from a wallet."""
    wallet_service = WalletService(db)
    agent_service = AgentService(db)
    
    wallet = await wallet_service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Verify ownership
    agent = await agent_service.get_agent(wallet.agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")
    
    removed = await wallet_service.remove_policy(policy_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    await db.commit()


@router.put("/{wallet_id}/spend-limits", response_model=SpendLimitResponse)
async def update_spend_limit(
    wallet_id: uuid.UUID,
    data: SpendLimitUpdate,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a spend limit for a wallet."""
    wallet_service = WalletService(db)
    agent_service = AgentService(db)
    
    wallet = await wallet_service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Verify ownership
    agent = await agent_service.get_agent(wallet.agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Convert USD to cents
    max_amount_cents = int(data.max_amount_usd * 100)
    
    limit = await wallet_service.update_spend_limit(
        wallet_id=wallet_id,
        period=data.period,
        max_amount_usd_cents=max_amount_cents,
    )
    
    await db.commit()
    
    return SpendLimitResponse(
        id=str(limit.id),
        period=limit.period.value,
        max_amount_usd=limit.max_amount_usd / 100,
        current_spent_usd=limit.current_spent_usd / 100,
        remaining_usd=limit.remaining_usd / 100,
        is_active=limit.is_active,
    )


@router.get("/{wallet_id}/spend-limits", response_model=list[SpendLimitResponse])
async def list_spend_limits(
    wallet_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List spend limits for a wallet."""
    wallet_service = WalletService(db)
    agent_service = AgentService(db)
    
    wallet = await wallet_service.get_wallet(wallet_id, include_policies=True)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Verify ownership
    agent = await agent_service.get_agent(wallet.agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return [
        SpendLimitResponse(
            id=str(l.id),
            period=l.period.value,
            max_amount_usd=l.max_amount_usd / 100,
            current_spent_usd=l.current_spent_usd / 100,
            remaining_usd=l.remaining_usd / 100,
            is_active=l.is_active,
        )
        for l in wallet.spend_limits
    ]


def _wallet_to_response(wallet) -> WalletResponse:
    """Convert wallet model to response schema."""
    return WalletResponse(
        id=str(wallet.id),
        address=wallet.address,
        wallet_type=wallet.wallet_type.value,
        chain_network=wallet.chain_network.value,
        agent_id=str(wallet.agent_id),
        label=wallet.label,
        is_primary=wallet.is_primary,
        is_active=wallet.is_active,
        native_balance_wei=wallet.native_balance_wei,
        usdc_balance_wei=wallet.usdc_balance_wei,
        created_at=wallet.created_at.isoformat(),
    )
