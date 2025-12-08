"""
Data API Routes

Turf Network data access and marketplace endpoints.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ClerkUser, get_current_user
from app.services.turf_service import get_turf_service

router = APIRouter(prefix="/data", tags=["Data"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class DataQueryRequest(BaseModel):
    """Schema for data query."""
    query: str = Field(..., min_length=1)
    data_type: str = "price"
    parameters: Optional[dict] = None
    use_cache: bool = True


class DataQueryResponse(BaseModel):
    """Schema for data query response."""
    data: Optional[dict] = None
    source: str = ""
    cost_usd: float = 0
    latency_ms: int = 0
    verification_hash: Optional[str] = None
    error: Optional[str] = None


class PriceRequest(BaseModel):
    """Schema for price request."""
    asset: str
    quote: str = "USD"
    include_history: bool = False
    history_period: str = "24h"


class PriceResponse(BaseModel):
    """Schema for price response."""
    asset: str
    quote: str
    price: Optional[float] = None
    change_24h: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    volume_24h: Optional[float] = None
    history: Optional[list] = None
    source: str = ""
    timestamp: Optional[str] = None
    error: Optional[str] = None


class YieldOpportunity(BaseModel):
    """Schema for yield opportunity."""
    protocol: str
    pool: str
    apy: float
    tvl_usd: float
    risk_score: int
    asset: str


class YieldsResponse(BaseModel):
    """Schema for yields response."""
    opportunities: list[YieldOpportunity]
    source: str
    error: Optional[str] = None


class SentimentResponse(BaseModel):
    """Schema for sentiment response."""
    topic: str
    overall_sentiment: float  # -1 to 1
    sentiment_label: str  # "bearish", "neutral", "bullish"
    volume: int
    sources_analyzed: int
    breakdown: Optional[dict] = None
    error: Optional[str] = None


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/query", response_model=DataQueryResponse)
async def query_data(
    data: DataQueryRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Query data from Turf Network.
    
    Supports natural language queries that are automatically
    routed to the best data sources.
    """
    turf = get_turf_service()
    
    result = await turf.fetch_data(
        query=data.query,
        data_type=data.data_type,
        parameters=data.parameters,
        use_cache=data.use_cache,
    )
    
    if result.get("error"):
        return DataQueryResponse(
            error=result["error"],
            latency_ms=result.get("latency_ms", 0),
        )
    
    return DataQueryResponse(
        data=result.get("data"),
        source=result.get("source", "turf"),
        cost_usd=result.get("cost_usd", 0),
        latency_ms=result.get("latency_ms", 0),
        verification_hash=result.get("verification_hash"),
    )


@router.get("/price/{asset}", response_model=PriceResponse)
async def get_price(
    asset: str,
    quote: str = Query("USD"),
    include_history: bool = Query(False),
    history_period: str = Query("24h"),
    user: ClerkUser = Depends(get_current_user),
):
    """
    Get asset price data.
    
    Fetches real-time price data from Turf Network's
    aggregated oracle sources.
    """
    turf = get_turf_service()
    
    result = await turf.get_price(
        asset=asset,
        quote=quote,
        include_history=include_history,
        history_period=history_period,
    )
    
    if result.get("error"):
        return PriceResponse(
            asset=asset,
            quote=quote,
            error=result["error"],
        )
    
    data = result.get("data", {})
    
    return PriceResponse(
        asset=asset.upper(),
        quote=quote.upper(),
        price=data.get("price"),
        change_24h=data.get("change_24h"),
        high_24h=data.get("high_24h"),
        low_24h=data.get("low_24h"),
        volume_24h=data.get("volume_24h"),
        history=data.get("history") if include_history else None,
        source=result.get("source", "turf"),
        timestamp=data.get("timestamp"),
    )


@router.get("/yields/{asset}", response_model=YieldsResponse)
async def get_yields(
    asset: str,
    protocols: Optional[str] = Query(None, description="Comma-separated protocol names"),
    min_tvl: int = Query(1000000, description="Minimum TVL in USD"),
    user: ClerkUser = Depends(get_current_user),
):
    """
    Get DeFi yield opportunities.
    
    Fetches yield farming and staking opportunities
    for the specified asset.
    """
    turf = get_turf_service()
    
    protocol_list = protocols.split(",") if protocols else None
    
    result = await turf.get_defi_yields(
        asset=asset,
        protocols=protocol_list,
        min_tvl=min_tvl,
    )
    
    if result.get("error"):
        return YieldsResponse(
            opportunities=[],
            source="turf",
            error=result["error"],
        )
    
    data = result.get("data", {})
    opportunities = [
        YieldOpportunity(
            protocol=opp.get("protocol", ""),
            pool=opp.get("pool", ""),
            apy=opp.get("apy", 0),
            tvl_usd=opp.get("tvl_usd", 0),
            risk_score=opp.get("risk_score", 5),
            asset=asset.upper(),
        )
        for opp in data.get("opportunities", [])
    ]
    
    return YieldsResponse(
        opportunities=opportunities,
        source=result.get("source", "turf"),
    )


@router.get("/sentiment/{topic}", response_model=SentimentResponse)
async def get_sentiment(
    topic: str,
    sources: Optional[str] = Query(None, description="Comma-separated sources"),
    timeframe: str = Query("24h"),
    user: ClerkUser = Depends(get_current_user),
):
    """
    Get sentiment analysis for a topic.
    
    Analyzes social media and news sentiment using
    Turf's AI-powered analysis.
    """
    turf = get_turf_service()
    
    source_list = sources.split(",") if sources else None
    
    result = await turf.analyze_sentiment(
        topic=topic,
        sources=source_list,
        timeframe=timeframe,
    )
    
    if result.get("error"):
        return SentimentResponse(
            topic=topic,
            overall_sentiment=0,
            sentiment_label="neutral",
            volume=0,
            sources_analyzed=0,
            error=result["error"],
        )
    
    data = result.get("data", {})
    
    # Determine sentiment label
    sentiment = data.get("overall_sentiment", 0)
    if sentiment < -0.3:
        label = "bearish"
    elif sentiment > 0.3:
        label = "bullish"
    else:
        label = "neutral"
    
    return SentimentResponse(
        topic=topic,
        overall_sentiment=sentiment,
        sentiment_label=label,
        volume=data.get("volume", 0),
        sources_analyzed=data.get("sources_analyzed", 0),
        breakdown=data.get("breakdown"),
    )


@router.get("/on-chain/{network}")
async def get_on_chain_metrics(
    network: str,
    metrics: Optional[str] = Query(None, description="Comma-separated metrics"),
    user: ClerkUser = Depends(get_current_user),
):
    """
    Get on-chain network metrics.
    
    Fetches blockchain metrics like active addresses,
    transaction count, gas prices, etc.
    """
    turf = get_turf_service()
    
    metric_list = metrics.split(",") if metrics else None
    
    result = await turf.get_on_chain_metrics(
        network=network,
        metrics=metric_list,
    )
    
    return {
        "network": network,
        "metrics": result.get("data", {}),
        "source": result.get("source", "turf"),
        "error": result.get("error"),
    }


@router.get("/sources")
async def discover_sources(
    data_type: str = Query("price"),
    user: ClerkUser = Depends(get_current_user),
):
    """
    Discover available data sources.
    
    Lists data providers in the Turf ecosystem
    for a given data type.
    """
    turf = get_turf_service()
    
    result = await turf.discover_data_sources(data_type=data_type)
    
    return {
        "data_type": data_type,
        "sources": result.get("sources", []),
        "error": result.get("error"),
    }
