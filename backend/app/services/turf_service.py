"""
Turf Data Service

Integration with Turf Network for intelligent data orchestration.
"""

import hashlib
import time
from typing import Any, Optional

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


class TurfService:
    """
    Turf Network Data Service.
    
    Provides intelligent data discovery, fetching, and caching
    through Turf's autonomous data orchestration protocol.
    """
    
    # Supported data types
    DATA_TYPES = {
        "price": "Real-time and historical price data",
        "market": "Market cap, volume, and trading data",
        "on_chain": "On-chain metrics and analytics",
        "sentiment": "Social sentiment and news analysis",
        "defi": "DeFi protocol data and yields",
    }
    
    def __init__(self):
        self.api_url = settings.turf_api_url
        self.api_key = settings.turf_api_key
        
        # In-memory cache for fast repeated requests
        self._cache: dict[str, tuple[Any, float]] = {}
        self._cache_ttl = 60  # 60 seconds default TTL
    
    def _get_cache_key(self, query: str, params: dict) -> str:
        """Generate cache key for a query."""
        data = f"{query}:{sorted(params.items())}"
        return hashlib.md5(data.encode()).hexdigest()
    
    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        if cache_key in self._cache:
            value, expires_at = self._cache[cache_key]
            if time.time() < expires_at:
                return value
            del self._cache[cache_key]
        return None
    
    def _set_cache(self, cache_key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL."""
        expires_at = time.time() + (ttl or self._cache_ttl)
        self._cache[cache_key] = (value, expires_at)
    
    async def fetch_data(
        self,
        query: str,
        data_type: str = "price",
        parameters: Optional[dict] = None,
        use_cache: bool = True,
        cache_ttl: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Fetch data from Turf Network.
        
        Args:
            query: Natural language or structured query
            data_type: Type of data to fetch
            parameters: Additional query parameters
            use_cache: Whether to use caching
            cache_ttl: Custom cache TTL in seconds
            
        Returns:
            Data response with result and metadata
        """
        params = parameters or {}
        
        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key(query, params)
            cached = self._get_from_cache(cache_key)
            if cached:
                logger.debug("turf_cache_hit", query=query)
                return {
                    "data": cached,
                    "source": "cache",
                    "cost_usd": 0,
                    "latency_ms": 0,
                }
        
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/v1/data/query",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "query": query,
                        "type": data_type,
                        "parameters": params,
                        "options": {
                            "verify": True,
                            "sources": "auto",
                        },
                    },
                    timeout=30.0,
                )
                
                latency_ms = int((time.time() - start_time) * 1000)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Cache the result
                    if use_cache:
                        self._set_cache(cache_key, result.get("data"), cache_ttl)
                    
                    return {
                        "data": result.get("data"),
                        "source": result.get("source", "turf"),
                        "cost_usd": result.get("cost", 0) / 100,  # cents to USD
                        "latency_ms": latency_ms,
                        "verification_hash": result.get("hash"),
                        "attribution": result.get("attribution"),
                    }
                else:
                    logger.error(
                        "turf_fetch_error",
                        status=response.status_code,
                        error=response.text,
                    )
                    return {
                        "data": None,
                        "error": f"Turf API error: {response.status_code}",
                        "latency_ms": latency_ms,
                    }
                    
        except httpx.TimeoutException:
            return {
                "data": None,
                "error": "Request timeout",
                "latency_ms": int((time.time() - start_time) * 1000),
            }
        except Exception as e:
            logger.error("turf_fetch_exception", error=str(e))
            return {
                "data": None,
                "error": str(e),
            }
    
    async def get_price(
        self,
        asset: str,
        quote: str = "USD",
        include_history: bool = False,
        history_period: str = "24h",
    ) -> dict[str, Any]:
        """
        Get asset price data.
        
        Args:
            asset: Asset symbol (e.g., "AVAX", "ETH")
            quote: Quote currency
            include_history: Include historical data
            history_period: Period for historical data
            
        Returns:
            Price data response
        """
        params = {
            "asset": asset.upper(),
            "quote": quote.upper(),
        }
        
        if include_history:
            params["history"] = history_period
        
        return await self.fetch_data(
            query=f"Price of {asset} in {quote}",
            data_type="price",
            parameters=params,
            cache_ttl=30 if not include_history else 300,
        )
    
    async def get_defi_yields(
        self,
        asset: str,
        protocols: Optional[list[str]] = None,
        min_tvl: int = 1_000_000,
    ) -> dict[str, Any]:
        """
        Get DeFi yield opportunities.
        
        Args:
            asset: Asset to find yields for
            protocols: List of protocols to search
            min_tvl: Minimum TVL in USD
            
        Returns:
            Yield opportunities data
        """
        params = {
            "asset": asset.upper(),
            "min_tvl": min_tvl,
        }
        
        if protocols:
            params["protocols"] = protocols
        
        return await self.fetch_data(
            query=f"DeFi yields for {asset}",
            data_type="defi",
            parameters=params,
            cache_ttl=300,  # 5 minutes
        )
    
    async def get_on_chain_metrics(
        self,
        network: str = "avalanche",
        metrics: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """
        Get on-chain network metrics.
        
        Args:
            network: Blockchain network
            metrics: Specific metrics to fetch
            
        Returns:
            On-chain metrics data
        """
        params = {
            "network": network.lower(),
        }
        
        if metrics:
            params["metrics"] = metrics
        
        return await self.fetch_data(
            query=f"On-chain metrics for {network}",
            data_type="on_chain",
            parameters=params,
            cache_ttl=60,
        )
    
    async def analyze_sentiment(
        self,
        topic: str,
        sources: Optional[list[str]] = None,
        timeframe: str = "24h",
    ) -> dict[str, Any]:
        """
        Analyze sentiment for a topic.
        
        Args:
            topic: Topic or asset to analyze
            sources: Social media sources
            timeframe: Analysis timeframe
            
        Returns:
            Sentiment analysis data
        """
        params = {
            "topic": topic,
            "timeframe": timeframe,
        }
        
        if sources:
            params["sources"] = sources
        
        return await self.fetch_data(
            query=f"Sentiment analysis for {topic}",
            data_type="sentiment",
            parameters=params,
            cache_ttl=300,
        )
    
    async def discover_data_sources(
        self,
        data_type: str,
        requirements: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Discover available data sources for a query type.
        
        Uses Turf's autonomous discovery to find optimal sources.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/v1/sources/discover",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    params={
                        "type": data_type,
                        **(requirements or {}),
                    },
                    timeout=10.0,
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": f"Discovery failed: {response.status_code}"}
                    
        except Exception as e:
            logger.error("turf_discovery_error", error=str(e))
            return {"error": str(e)}


# Singleton instance
_turf_service: Optional[TurfService] = None


def get_turf_service() -> TurfService:
    """Get Turf service singleton."""
    global _turf_service
    if _turf_service is None:
        _turf_service = TurfService()
    return _turf_service
