"""
Intents API Routes

ERC-8004 intent management and execution.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ClerkUser, get_current_user
from app.services.agent_service import AgentService
from app.services.ai_service import get_ai_service
from app.services.blockchain_service import get_blockchain_service

router = APIRouter(prefix="/intents", tags=["Intents"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class IntentCreate(BaseModel):
    """Schema for creating an intent."""
    raw_input: str = Field(..., min_length=1, max_length=1000)
    agent_id: UUID


class IntentResponse(BaseModel):
    """Schema for intent response."""
    id: UUID
    agent_id: UUID
    raw_input: str
    intent_type: str
    parameters: dict
    status: str
    confidence: float
    created_at: str
    
    class Config:
        from_attributes = True


class IntentAnalyzeResponse(BaseModel):
    """Schema for intent analysis."""
    intent_type: str
    parameters: dict
    confidence: float
    reasoning: str
    estimated_cost_usd: Optional[float] = None
    risks: list[str] = []


class IntentExecuteRequest(BaseModel):
    """Schema for executing an intent."""
    confirm: bool = False
    slippage_tolerance: float = 0.5


class IntentExecuteResponse(BaseModel):
    """Schema for execution response."""
    success: bool
    tx_hash: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/", response_model=IntentResponse)
async def create_intent(
    data: IntentCreate,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create and analyze a new intent.
    
    Parses natural language input into structured intent
    using AI analysis.
    """
    from app.models.intent import Intent, IntentStatus
    
    # Verify agent ownership
    agent_service = AgentService(db)
    agent = await agent_service.get_agent(data.agent_id)
    
    if not agent or agent.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Analyze intent with AI
    ai = get_ai_service()
    analysis = await ai.analyze_intent(
        user_message=data.raw_input,
        agent_capabilities=["trade", "transfer", "stake", "purchase", "analyze"],
        available_actions=[
            "swap",
            "bridge",
            "stake",
            "unstake",
            "transfer",
            "buy_product",
            "fetch_data",
            "set_alert",
        ],
    )
    
    # Create intent record
    intent = Intent(
        agent_id=data.agent_id,
        user_id=user.id,
        raw_input=data.raw_input,
        intent_type=analysis.get("intent_type", "unknown"),
        parameters=analysis.get("parameters", {}),
        confidence=analysis.get("confidence", 0),
        status=IntentStatus.PENDING,
    )
    
    db.add(intent)
    await db.commit()
    await db.refresh(intent)
    
    return IntentResponse(
        id=intent.id,
        agent_id=intent.agent_id,
        raw_input=intent.raw_input,
        intent_type=intent.intent_type,
        parameters=intent.parameters,
        status=intent.status.value,
        confidence=intent.confidence,
        created_at=intent.created_at.isoformat(),
    )


@router.get("/{intent_id}", response_model=IntentResponse)
async def get_intent(
    intent_id: UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get intent details."""
    from sqlalchemy import select
    from app.models.intent import Intent
    
    result = await db.execute(
        select(Intent).where(
            Intent.id == intent_id,
            Intent.user_id == user.id,
        )
    )
    intent = result.scalar_one_or_none()
    
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    return IntentResponse(
        id=intent.id,
        agent_id=intent.agent_id,
        raw_input=intent.raw_input,
        intent_type=intent.intent_type,
        parameters=intent.parameters,
        status=intent.status.value,
        confidence=intent.confidence,
        created_at=intent.created_at.isoformat(),
    )


@router.get("/", response_model=list[IntentResponse])
async def list_intents(
    agent_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's intents."""
    from sqlalchemy import select
    from app.models.intent import Intent, IntentStatus
    
    query = select(Intent).where(Intent.user_id == user.id)
    
    if agent_id:
        query = query.where(Intent.agent_id == agent_id)
    
    if status:
        query = query.where(Intent.status == IntentStatus(status))
    
    query = query.order_by(Intent.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    intents = result.scalars().all()
    
    return [
        IntentResponse(
            id=intent.id,
            agent_id=intent.agent_id,
            raw_input=intent.raw_input,
            intent_type=intent.intent_type,
            parameters=intent.parameters,
            status=intent.status.value,
            confidence=intent.confidence,
            created_at=intent.created_at.isoformat(),
        )
        for intent in intents
    ]


@router.post("/{intent_id}/analyze", response_model=IntentAnalyzeResponse)
async def analyze_intent(
    intent_id: UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Re-analyze an intent with current market data.
    
    Returns updated analysis including cost estimates
    and risk assessment.
    """
    from sqlalchemy import select
    from app.models.intent import Intent
    
    result = await db.execute(
        select(Intent).where(
            Intent.id == intent_id,
            Intent.user_id == user.id,
        )
    )
    intent = result.scalar_one_or_none()
    
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    ai = get_ai_service()
    
    # Re-analyze with more detail
    analysis = await ai.analyze_intent(
        user_message=intent.raw_input,
        agent_capabilities=["trade", "transfer", "stake", "purchase", "analyze"],
        available_actions=[
            "swap",
            "bridge",
            "stake",
            "unstake",
            "transfer",
            "buy_product",
            "fetch_data",
            "set_alert",
        ],
    )
    
    # Estimate costs
    risks = []
    estimated_cost = 0.0
    
    if intent.intent_type in ["swap", "transfer", "stake", "unstake"]:
        # Add gas cost estimate
        estimated_cost = 0.50  # Base gas estimate in USD
        risks.append("Gas prices may vary")
    
    if intent.intent_type == "swap":
        risks.append("Price slippage may affect final amount")
        risks.append("Ensure sufficient liquidity in pool")
    
    return IntentAnalyzeResponse(
        intent_type=analysis.get("intent_type", intent.intent_type),
        parameters=analysis.get("parameters", intent.parameters),
        confidence=analysis.get("confidence", intent.confidence),
        reasoning=analysis.get("reasoning", ""),
        estimated_cost_usd=estimated_cost,
        risks=risks,
    )


@router.post("/{intent_id}/execute", response_model=IntentExecuteResponse)
async def execute_intent(
    intent_id: UUID,
    data: IntentExecuteRequest,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute an intent.
    
    Requires confirmation for transactions that
    modify blockchain state.
    """
    from sqlalchemy import select
    from app.models.intent import Intent, IntentStatus
    
    result = await db.execute(
        select(Intent).where(
            Intent.id == intent_id,
            Intent.user_id == user.id,
        )
    )
    intent = result.scalar_one_or_none()
    
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    if intent.status not in [IntentStatus.PENDING, IntentStatus.CONFIRMED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot execute intent in {intent.status.value} state",
        )
    
    if not data.confirm:
        raise HTTPException(
            status_code=400,
            detail="Transaction requires confirmation. Set confirm=true to proceed.",
        )
    
    # Update status
    intent.status = IntentStatus.EXECUTING
    await db.commit()
    
    try:
        # Execute based on intent type
        blockchain = get_blockchain_service()
        
        result_data = None
        tx_hash = None
        
        if intent.intent_type == "fetch_data":
            # Data fetch doesn't need blockchain
            from app.services.turf_service import get_turf_service
            turf = get_turf_service()
            result_data = await turf.fetch_data(
                query=intent.parameters.get("query", intent.raw_input),
                data_type=intent.parameters.get("data_type", "price"),
            )
        
        elif intent.intent_type in ["swap", "transfer", "stake", "unstake"]:
            # These need blockchain execution
            # For now, return a placeholder - real implementation would
            # interact with DEX contracts
            result_data = {
                "message": f"Intent type {intent.intent_type} execution pending",
                "parameters": intent.parameters,
            }
        
        elif intent.intent_type == "buy_product":
            # Use Reap protocol
            from app.services.reap_service import get_reap_service
            reap = get_reap_service()
            # This would execute actual purchase
            result_data = {
                "message": "Product purchase initiated",
                "parameters": intent.parameters,
            }
        
        else:
            result_data = {
                "message": f"Unknown intent type: {intent.intent_type}",
            }
        
        # Update status
        intent.status = IntentStatus.EXECUTED
        intent.result = result_data
        await db.commit()
        
        return IntentExecuteResponse(
            success=True,
            tx_hash=tx_hash,
            result=result_data,
        )
    
    except Exception as e:
        intent.status = IntentStatus.FAILED
        intent.error = str(e)
        await db.commit()
        
        return IntentExecuteResponse(
            success=False,
            error=str(e),
        )


@router.delete("/{intent_id}")
async def cancel_intent(
    intent_id: UUID,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending intent."""
    from sqlalchemy import select
    from app.models.intent import Intent, IntentStatus
    
    result = await db.execute(
        select(Intent).where(
            Intent.id == intent_id,
            Intent.user_id == user.id,
        )
    )
    intent = result.scalar_one_or_none()
    
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    
    if intent.status not in [IntentStatus.PENDING, IntentStatus.CONFIRMED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel intent in {intent.status.value} state",
        )
    
    intent.status = IntentStatus.CANCELLED
    await db.commit()
    
    return {"message": "Intent cancelled successfully"}
