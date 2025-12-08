"""
Wallet Service

ERC-4337 wallet management with policy enforcement.
"""

import uuid
from typing import Any, Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.wallet import (
    AgentWallet,
    WalletType,
    ChainNetwork,
    WalletPolicy,
    PolicyType,
    SpendLimit,
    SpendLimitPeriod,
)
from app.services.blockchain_service import get_blockchain_service

settings = get_settings()
logger = get_logger(__name__)


class WalletService:
    """
    Agent wallet management service.
    
    Handles wallet creation, policy management, and spend tracking.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.blockchain = get_blockchain_service()
    
    async def create_wallet(
        self,
        agent_id: uuid.UUID,
        label: str = "Primary",
        wallet_type: WalletType = WalletType.ERC4337,
        chain_network: ChainNetwork = ChainNetwork.AVALANCHE_FUJI,
        is_primary: bool = False,
    ) -> AgentWallet:
        """
        Create a new wallet for an agent.
        
        For ERC-4337 wallets, this creates a counterfactual address
        that will be deployed on first transaction.
        
        Args:
            agent_id: Agent UUID
            label: Wallet label
            wallet_type: Type of wallet
            chain_network: Target network
            is_primary: Whether this is the primary wallet
            
        Returns:
            Created wallet
        """
        # Generate wallet address
        if wallet_type == WalletType.EOA:
            # Create standard EOA wallet
            wallet_data = self.blockchain.create_wallet()
            address = wallet_data["address"]
        else:
            # For ERC-4337, generate counterfactual address
            # In production, this would use Thirdweb SDK
            wallet_data = self.blockchain.create_wallet()
            address = wallet_data["address"]
        
        # If setting as primary, unset existing primary
        if is_primary:
            existing_primary = await self.db.execute(
                select(AgentWallet)
                .where(
                    and_(
                        AgentWallet.agent_id == agent_id,
                        AgentWallet.is_primary == True,
                    )
                )
            )
            for wallet in existing_primary.scalars():
                wallet.is_primary = False
        
        wallet = AgentWallet(
            agent_id=agent_id,
            address=address.lower(),
            wallet_type=wallet_type,
            chain_network=chain_network,
            label=label,
            is_primary=is_primary,
        )
        
        self.db.add(wallet)
        await self.db.flush()
        
        # Create default spend limits
        await self._create_default_spend_limits(wallet.id)
        
        logger.info(
            "wallet_created",
            wallet_id=str(wallet.id),
            address=address,
            type=wallet_type.value,
        )
        
        return wallet
    
    async def _create_default_spend_limits(self, wallet_id: uuid.UUID) -> None:
        """Create default spend limits for a wallet."""
        import time
        
        default_limits = [
            (SpendLimitPeriod.DAILY, settings.default_daily_spend_limit * 100),
            (SpendLimitPeriod.PER_TRANSACTION, settings.default_transaction_limit * 100),
        ]
        
        for period, max_amount in default_limits:
            limit = SpendLimit(
                wallet_id=wallet_id,
                period=period,
                max_amount_usd=max_amount,
                period_start_timestamp=int(time.time()),
            )
            self.db.add(limit)
    
    async def get_wallet(
        self,
        wallet_id: uuid.UUID,
        include_policies: bool = False,
    ) -> Optional[AgentWallet]:
        """Get wallet by ID."""
        query = select(AgentWallet).where(AgentWallet.id == wallet_id)
        
        if include_policies:
            query = query.options(
                selectinload(AgentWallet.policies),
                selectinload(AgentWallet.spend_limits),
            )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_wallet_by_address(
        self,
        address: str,
        include_policies: bool = False,
    ) -> Optional[AgentWallet]:
        """Get wallet by address."""
        query = select(AgentWallet).where(
            AgentWallet.address == address.lower()
        )
        
        if include_policies:
            query = query.options(
                selectinload(AgentWallet.policies),
                selectinload(AgentWallet.spend_limits),
            )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def list_wallets(
        self,
        agent_id: uuid.UUID,
        active_only: bool = True,
    ) -> list[AgentWallet]:
        """List wallets for an agent."""
        query = select(AgentWallet).where(AgentWallet.agent_id == agent_id)
        
        if active_only:
            query = query.where(AgentWallet.is_active == True)
        
        query = query.order_by(AgentWallet.is_primary.desc())
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def add_policy(
        self,
        wallet_id: uuid.UUID,
        name: str,
        policy_type: PolicyType,
        config: dict,
        description: Optional[str] = None,
        priority: int = 0,
    ) -> WalletPolicy:
        """
        Add a policy to a wallet.
        
        Args:
            wallet_id: Wallet UUID
            name: Policy name
            policy_type: Type of policy
            config: Policy configuration
            description: Optional description
            priority: Execution priority (higher = first)
            
        Returns:
            Created policy
        """
        policy = WalletPolicy(
            wallet_id=wallet_id,
            name=name,
            policy_type=policy_type,
            config=config,
            description=description,
            priority=priority,
        )
        
        self.db.add(policy)
        await self.db.flush()
        
        logger.info(
            "policy_added",
            wallet_id=str(wallet_id),
            policy_name=name,
            type=policy_type.value,
        )
        
        return policy
    
    async def remove_policy(
        self,
        policy_id: uuid.UUID,
    ) -> bool:
        """Remove a policy."""
        result = await self.db.execute(
            select(WalletPolicy).where(WalletPolicy.id == policy_id)
        )
        policy = result.scalar_one_or_none()
        
        if policy:
            await self.db.delete(policy)
            await self.db.flush()
            return True
        return False
    
    async def update_spend_limit(
        self,
        wallet_id: uuid.UUID,
        period: SpendLimitPeriod,
        max_amount_usd_cents: int,
    ) -> Optional[SpendLimit]:
        """Update or create a spend limit."""
        result = await self.db.execute(
            select(SpendLimit).where(
                and_(
                    SpendLimit.wallet_id == wallet_id,
                    SpendLimit.period == period,
                )
            )
        )
        limit = result.scalar_one_or_none()
        
        if limit:
            limit.max_amount_usd = max_amount_usd_cents
        else:
            import time
            limit = SpendLimit(
                wallet_id=wallet_id,
                period=period,
                max_amount_usd=max_amount_usd_cents,
                period_start_timestamp=int(time.time()),
            )
            self.db.add(limit)
        
        await self.db.flush()
        return limit
    
    async def check_spend_limits(
        self,
        wallet_id: uuid.UUID,
        amount_usd_cents: int,
    ) -> tuple[bool, Optional[str]]:
        """
        Check if a spend amount is within limits.
        
        Args:
            wallet_id: Wallet UUID
            amount_usd_cents: Amount to spend in cents
            
        Returns:
            Tuple of (allowed, reason if not allowed)
        """
        result = await self.db.execute(
            select(SpendLimit)
            .where(
                and_(
                    SpendLimit.wallet_id == wallet_id,
                    SpendLimit.is_active == True,
                )
            )
        )
        limits = result.scalars().all()
        
        for limit in limits:
            # Check per-transaction limit
            if limit.period == SpendLimitPeriod.PER_TRANSACTION:
                if amount_usd_cents > limit.max_amount_usd:
                    return False, f"Exceeds per-transaction limit of ${limit.max_amount_usd / 100:.2f}"
            
            # Check period-based limits
            else:
                if limit.current_spent_usd + amount_usd_cents > limit.max_amount_usd:
                    return False, f"Exceeds {limit.period.value} limit of ${limit.max_amount_usd / 100:.2f}"
        
        return True, None
    
    async def record_spend(
        self,
        wallet_id: uuid.UUID,
        amount_usd_cents: int,
    ) -> None:
        """Record a spend against limits."""
        result = await self.db.execute(
            select(SpendLimit)
            .where(
                and_(
                    SpendLimit.wallet_id == wallet_id,
                    SpendLimit.is_active == True,
                    SpendLimit.period != SpendLimitPeriod.PER_TRANSACTION,
                )
            )
        )
        limits = result.scalars().all()
        
        for limit in limits:
            limit.current_spent_usd += amount_usd_cents
        
        await self.db.flush()
    
    async def evaluate_policies(
        self,
        wallet_id: uuid.UUID,
        transaction: dict[str, Any],
    ) -> tuple[bool, list[str]]:
        """
        Evaluate all policies for a transaction.
        
        Args:
            wallet_id: Wallet UUID
            transaction: Transaction details to evaluate
            
        Returns:
            Tuple of (allowed, list of reasons if not allowed)
        """
        result = await self.db.execute(
            select(WalletPolicy)
            .where(
                and_(
                    WalletPolicy.wallet_id == wallet_id,
                    WalletPolicy.is_active == True,
                )
            )
            .order_by(WalletPolicy.priority.desc())
        )
        policies = result.scalars().all()
        
        violations = []
        
        for policy in policies:
            allowed, reason = self._evaluate_policy(policy, transaction)
            if not allowed:
                violations.append(f"{policy.name}: {reason}")
        
        return len(violations) == 0, violations
    
    def _evaluate_policy(
        self,
        policy: WalletPolicy,
        transaction: dict[str, Any],
    ) -> tuple[bool, Optional[str]]:
        """Evaluate a single policy."""
        config = policy.config
        
        if policy.policy_type == PolicyType.ALLOWLIST:
            allowed_addresses = [a.lower() for a in config.get("addresses", [])]
            to_address = transaction.get("to", "").lower()
            if to_address and to_address not in allowed_addresses:
                return False, f"Address {to_address} not in allowlist"
        
        elif policy.policy_type == PolicyType.BLOCKLIST:
            blocked_addresses = [a.lower() for a in config.get("addresses", [])]
            to_address = transaction.get("to", "").lower()
            if to_address in blocked_addresses:
                return False, f"Address {to_address} is blocked"
        
        elif policy.policy_type == PolicyType.CONTRACT_CALL:
            allowed_contract = config.get("contract", "").lower()
            allowed_methods = config.get("methods", [])
            to_address = transaction.get("to", "").lower()
            method = transaction.get("method", "")
            
            if to_address != allowed_contract:
                return False, f"Contract {to_address} not allowed"
            if allowed_methods and method not in allowed_methods:
                return False, f"Method {method} not allowed"
        
        elif policy.policy_type == PolicyType.TIME_BASED:
            import time
            from datetime import datetime
            
            now = datetime.now()
            allowed_hours = config.get("allowed_hours", list(range(24)))
            allowed_days = config.get("allowed_days", list(range(7)))
            
            if now.hour not in allowed_hours:
                return False, f"Hour {now.hour} not allowed"
            if now.weekday() not in allowed_days:
                return False, f"Day {now.weekday()} not allowed"
        
        return True, None
    
    async def sync_balances(self, wallet_id: uuid.UUID) -> Optional[AgentWallet]:
        """Sync wallet balances from blockchain."""
        wallet = await self.get_wallet(wallet_id)
        if not wallet:
            return None
        
        network = wallet.chain_network.value.replace("_", "_")
        balance = await self.blockchain.get_balance(
            wallet.address,
            network=network,
        )
        
        if "native" in balance:
            wallet.native_balance_wei = balance["native"]["balance_wei"]
        if "usdc" in balance:
            wallet.usdc_balance_wei = balance["usdc"]["balance_wei"]
        
        await self.db.flush()
        return wallet
