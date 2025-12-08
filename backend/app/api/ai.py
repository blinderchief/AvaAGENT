"""
AI API Routes

Gemini inference and agent reasoning endpoints.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.security import ClerkUser, get_current_user
from app.services.ai_service import get_ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ChatMessage(BaseModel):
    """Schema for chat message."""
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    """Schema for chat request."""
    message: str
    system_prompt: Optional[str] = None
    context: Optional[list[ChatMessage]] = None
    use_flash: bool = False


class ChatResponse(BaseModel):
    """Schema for chat response."""
    message: str
    tokens: dict
    function_call: Optional[dict] = None


class IntentAnalysisRequest(BaseModel):
    """Schema for intent analysis."""
    message: str
    capabilities: list[str] = Field(
        default=["trade", "data_fetch", "purchase", "analyze"]
    )
    available_actions: list[str] = Field(
        default=["swap", "transfer", "stake", "fetch_price", "buy_product"]
    )


class IntentAnalysisResponse(BaseModel):
    """Schema for intent analysis response."""
    intent_type: str
    parameters: dict
    confidence: float
    reasoning: str


class TransactionPlanRequest(BaseModel):
    """Schema for transaction plan request."""
    intent: dict
    wallet_balance: dict
    market_data: Optional[dict] = None


class TransactionPlanResponse(BaseModel):
    """Schema for transaction plan response."""
    steps: list[dict]
    estimated_gas_usd: float
    estimated_value_usd: float
    risks: list[str]
    alternatives: list[dict]
    error: Optional[str] = None


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Chat with AI assistant.
    
    Uses Gemini for intelligent conversation about
    DeFi, trading, and agent operations.
    """
    ai = get_ai_service()
    
    context = None
    if data.context:
        context = [{"role": m.role, "content": m.content} for m in data.context]
    
    result = await ai.generate(
        prompt=data.message,
        system_prompt=data.system_prompt,
        context=context,
        use_flash=data.use_flash,
    )
    
    return ChatResponse(
        message=result["text"],
        tokens=result["tokens"],
        function_call=result.get("function_call"),
    )


@router.post("/chat/stream")
async def chat_stream(
    data: ChatRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Stream chat response.
    
    Returns a streaming response for real-time
    text generation.
    """
    ai = get_ai_service()
    
    context = None
    if data.context:
        context = [{"role": m.role, "content": m.content} for m in data.context]
    
    async def generate():
        async for chunk in ai.stream_generate(
            prompt=data.message,
            system_prompt=data.system_prompt,
            context=context,
            use_flash=data.use_flash,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


@router.post("/analyze-intent", response_model=IntentAnalysisResponse)
async def analyze_intent(
    data: IntentAnalysisRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Analyze user message to extract intent.
    
    Uses AI to understand what action the user
    wants the agent to perform.
    """
    ai = get_ai_service()
    
    result = await ai.analyze_intent(
        user_message=data.message,
        agent_capabilities=data.capabilities,
        available_actions=data.available_actions,
    )
    
    return IntentAnalysisResponse(
        intent_type=result.get("intent_type", "unknown"),
        parameters=result.get("parameters", {}),
        confidence=result.get("confidence", 0),
        reasoning=result.get("reasoning", ""),
    )


@router.post("/plan-transaction", response_model=TransactionPlanResponse)
async def plan_transaction(
    data: TransactionPlanRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Generate execution plan for an intent.
    
    Creates a step-by-step plan for executing
    a trading or DeFi operation.
    """
    ai = get_ai_service()
    
    result = await ai.generate_transaction_plan(
        intent=data.intent,
        wallet_balance=data.wallet_balance,
        market_data=data.market_data,
    )
    
    if "error" in result:
        return TransactionPlanResponse(
            steps=[],
            estimated_gas_usd=0,
            estimated_value_usd=0,
            risks=[],
            alternatives=[],
            error=result.get("error") or result.get("raw"),
        )
    
    return TransactionPlanResponse(
        steps=result.get("steps", []),
        estimated_gas_usd=result.get("estimated_gas_usd", 0),
        estimated_value_usd=result.get("estimated_value_usd", 0),
        risks=result.get("risks", []),
        alternatives=result.get("alternatives", []),
    )


@router.get("/models")
async def list_models(
    user: ClerkUser = Depends(get_current_user),
):
    """
    List available AI models.
    
    Returns the models that can be used for
    agent operations.
    """
    from app.core.config import get_settings
    settings = get_settings()
    
    return {
        "models": [
            {
                "id": settings.gemini_model,
                "name": "Gemini 1.5 Pro",
                "description": "Advanced model for complex reasoning",
                "max_tokens": settings.ai_max_tokens,
                "recommended_for": ["transaction_planning", "complex_analysis"],
            },
            {
                "id": settings.gemini_flash_model,
                "name": "Gemini 1.5 Flash",
                "description": "Fast model for quick responses",
                "max_tokens": 4096,
                "recommended_for": ["chat", "intent_analysis", "quick_queries"],
            },
        ],
        "default": settings.gemini_model,
    }
