"""
Agent Service

Business logic for AI agent management.
"""

import uuid
from typing import Any, Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.agent import Agent, AgentStatus, AgentType
from app.models.wallet import AgentWallet, WalletType, ChainNetwork

logger = get_logger(__name__)


class AgentService:
    """
    Agent management service.
    
    Handles CRUD operations and business logic for AI agents.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_agent(
        self,
        owner_id: str,
        name: str,
        agent_type: AgentType = AgentType.CUSTOM,
        description: Optional[str] = None,
        config: Optional[dict] = None,
        capabilities: Optional[list] = None,
        system_prompt: Optional[str] = None,
    ) -> Agent:
        """
        Create a new AI agent.
        
        Args:
            owner_id: Clerk user ID of the owner
            name: Agent name
            agent_type: Type of agent
            description: Agent description
            config: Agent configuration
            capabilities: List of capabilities
            system_prompt: Custom system prompt
            
        Returns:
            Created agent
        """
        agent = Agent(
            owner_id=owner_id,
            name=name,
            agent_type=agent_type,
            description=description,
            config=config or {},
            capabilities=capabilities or [],
            system_prompt=system_prompt,
            status=AgentStatus.DRAFT,
        )
        
        self.db.add(agent)
        await self.db.flush()
        
        logger.info(
            "agent_created",
            agent_id=str(agent.id),
            name=name,
            type=agent_type.value,
        )
        
        return agent
    
    async def get_agent(
        self,
        agent_id: uuid.UUID,
        owner_id: Optional[str] = None,
        include_wallets: bool = False,
    ) -> Optional[Agent]:
        """
        Get an agent by ID.
        
        Args:
            agent_id: Agent UUID
            owner_id: Optional owner filter for authorization
            include_wallets: Include wallet relationships
            
        Returns:
            Agent or None
        """
        query = select(Agent).where(Agent.id == agent_id)
        
        if owner_id:
            query = query.where(Agent.owner_id == owner_id)
        
        if include_wallets:
            query = query.options(selectinload(Agent.wallets))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def list_agents(
        self,
        owner_id: str,
        status: Optional[AgentStatus] = None,
        agent_type: Optional[AgentType] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Agent]:
        """
        List agents for an owner.
        
        Args:
            owner_id: Clerk user ID
            status: Optional status filter
            agent_type: Optional type filter
            limit: Maximum results
            offset: Pagination offset
            
        Returns:
            List of agents
        """
        query = select(Agent).where(Agent.owner_id == owner_id)
        
        if status:
            query = query.where(Agent.status == status)
        if agent_type:
            query = query.where(Agent.agent_type == agent_type)
        
        query = query.order_by(Agent.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def update_agent(
        self,
        agent_id: uuid.UUID,
        owner_id: str,
        **updates: Any,
    ) -> Optional[Agent]:
        """
        Update an agent.
        
        Args:
            agent_id: Agent UUID
            owner_id: Owner ID for authorization
            **updates: Fields to update
            
        Returns:
            Updated agent or None
        """
        agent = await self.get_agent(agent_id, owner_id)
        if not agent:
            return None
        
        # Allowed update fields
        allowed_fields = {
            "name", "description", "config", "capabilities",
            "system_prompt", "ai_model", "can_trade", "can_purchase",
            "can_access_data",
        }
        
        for key, value in updates.items():
            if key in allowed_fields:
                setattr(agent, key, value)
        
        await self.db.flush()
        
        logger.info("agent_updated", agent_id=str(agent_id))
        return agent
    
    async def activate_agent(
        self,
        agent_id: uuid.UUID,
        owner_id: str,
    ) -> Optional[Agent]:
        """
        Activate an agent (change status to ACTIVE).
        
        Requires at least one wallet to be configured.
        """
        agent = await self.get_agent(agent_id, owner_id, include_wallets=True)
        if not agent:
            return None
        
        # Validation
        if not agent.wallets:
            raise ValueError("Agent must have at least one wallet to activate")
        
        agent.status = AgentStatus.ACTIVE
        await self.db.flush()
        
        logger.info("agent_activated", agent_id=str(agent_id))
        return agent
    
    async def pause_agent(
        self,
        agent_id: uuid.UUID,
        owner_id: str,
    ) -> Optional[Agent]:
        """Pause an active agent."""
        agent = await self.get_agent(agent_id, owner_id)
        if not agent:
            return None
        
        if agent.status != AgentStatus.ACTIVE:
            raise ValueError("Can only pause active agents")
        
        agent.status = AgentStatus.PAUSED
        await self.db.flush()
        
        logger.info("agent_paused", agent_id=str(agent_id))
        return agent
    
    async def delete_agent(
        self,
        agent_id: uuid.UUID,
        owner_id: str,
    ) -> bool:
        """
        Delete an agent (archive).
        
        Returns True if deleted, False if not found.
        """
        agent = await self.get_agent(agent_id, owner_id)
        if not agent:
            return False
        
        agent.status = AgentStatus.ARCHIVED
        await self.db.flush()
        
        logger.info("agent_deleted", agent_id=str(agent_id))
        return True
    
    async def update_metrics(
        self,
        agent_id: uuid.UUID,
        transaction_count: int = 0,
        volume_usd_cents: int = 0,
        success: bool = True,
    ) -> None:
        """
        Update agent metrics after a transaction.
        
        Args:
            agent_id: Agent UUID
            transaction_count: Number of transactions to add
            volume_usd_cents: Volume in USD cents to add
            success: Whether transaction was successful
        """
        agent = await self.get_agent(agent_id)
        if not agent:
            return
        
        agent.total_transactions += transaction_count
        agent.total_volume_usd += volume_usd_cents
        
        # Update success rate
        if agent.total_transactions > 0:
            if success:
                # Exponential moving average
                agent.success_rate = int(
                    agent.success_rate * 0.95 + 100 * 0.05
                )
            else:
                agent.success_rate = int(
                    agent.success_rate * 0.95 + 0 * 0.05
                )
        
        await self.db.flush()
    
    async def get_agent_by_wallet(
        self,
        wallet_address: str,
    ) -> Optional[Agent]:
        """Get agent by wallet address."""
        query = (
            select(Agent)
            .join(AgentWallet)
            .where(AgentWallet.address == wallet_address.lower())
            .options(selectinload(Agent.wallets))
        )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
