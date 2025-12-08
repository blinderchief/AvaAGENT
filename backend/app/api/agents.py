"""
Agent API Routes

CRUD and management endpoints for AI agents.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ClerkUser, get_current_user
from app.models.agent import AgentStatus, AgentType
from app.services.agent_service import AgentService

router = APIRouter(prefix="/agents", tags=["Agents"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class AgentCreate(BaseModel):
    """Schema for creating an agent."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    agent_type: AgentType = AgentType.CUSTOM
    config: Optional[dict] = None
    capabilities: Optional[list[str]] = None
    system_prompt: Optional[str] = None


class AgentUpdate(BaseModel):
    """Schema for updating an agent."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[dict] = None
    capabilities: Optional[list[str]] = None
    system_prompt: Optional[str] = None
    ai_model: Optional[str] = None
    can_trade: Optional[bool] = None
    can_purchase: Optional[bool] = None
    can_access_data: Optional[bool] = None


class AgentResponse(BaseModel):
    """Schema for agent response."""
    id: str
    name: str
    description: Optional[str]
    agent_type: str
    status: str
    owner_id: str
    config: dict
    capabilities: list
    ai_model: str
    reputation_score: int
    total_transactions: int
    total_volume_usd: int
    success_rate: int
    is_verified: bool
    can_trade: bool
    can_purchase: bool
    can_access_data: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    """Schema for agent list response."""
    agents: list[AgentResponse]
    total: int


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    data: AgentCreate,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new AI agent."""
    service = AgentService(db)
    
    agent = await service.create_agent(
        owner_id=user.id,
        name=data.name,
        agent_type=data.agent_type,
        description=data.description,
        config=data.config,
        capabilities=data.capabilities,
        system_prompt=data.system_prompt,
    )
    
    await db.commit()
    
    return _agent_to_response(agent)


@router.get("", response_model=AgentListResponse)
async def list_agents(
    status: Optional[AgentStatus] = Query(None),
    agent_type: Optional[AgentType] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List agents for the current user."""
    service = AgentService(db)
    
    agents = await service.list_agents(
        owner_id=user.id,
        status=status,
        agent_type=agent_type,
        limit=limit,
        offset=offset,
    )
    
    return AgentListResponse(
        agents=[_agent_to_response(a) for a in agents],
        total=len(agents),
    )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get agent details."""
    service = AgentService(db)
    
    agent = await service.get_agent(agent_id, owner_id=user.id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return _agent_to_response(agent)


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: uuid.UUID,
    data: AgentUpdate,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update agent details."""
    service = AgentService(db)
    
    updates = data.model_dump(exclude_unset=True)
    agent = await service.update_agent(agent_id, user.id, **updates)
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    await db.commit()
    
    return _agent_to_response(agent)


@router.post("/{agent_id}/activate", response_model=AgentResponse)
async def activate_agent(
    agent_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate an agent."""
    service = AgentService(db)
    
    try:
        agent = await service.activate_agent(agent_id, user.id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        await db.commit()
        return _agent_to_response(agent)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{agent_id}/pause", response_model=AgentResponse)
async def pause_agent(
    agent_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pause an active agent."""
    service = AgentService(db)
    
    try:
        agent = await service.pause_agent(agent_id, user.id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        await db.commit()
        return _agent_to_response(agent)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: uuid.UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete (archive) an agent."""
    service = AgentService(db)
    
    deleted = await service.delete_agent(agent_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    await db.commit()


def _agent_to_response(agent) -> AgentResponse:
    """Convert agent model to response schema."""
    return AgentResponse(
        id=str(agent.id),
        name=agent.name,
        description=agent.description,
        agent_type=agent.agent_type.value,
        status=agent.status.value,
        owner_id=agent.owner_id,
        config=agent.config,
        capabilities=agent.capabilities,
        ai_model=agent.ai_model,
        reputation_score=agent.reputation_score,
        total_transactions=agent.total_transactions,
        total_volume_usd=agent.total_volume_usd,
        success_rate=agent.success_rate,
        is_verified=agent.is_verified,
        can_trade=agent.can_trade,
        can_purchase=agent.can_purchase,
        can_access_data=agent.can_access_data,
        created_at=agent.created_at.isoformat(),
        updated_at=agent.updated_at.isoformat(),
    )
