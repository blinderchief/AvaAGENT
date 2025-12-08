"""
Reap Protocol Service

Integration with Reap for real-world product purchases and settlements.
"""

import uuid
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


@dataclass
class ReapProduct:
    """Product information from Reap."""
    id: str
    title: str
    price_usd: float
    currency: str
    merchant: str
    url: str
    image_url: Optional[str] = None
    available: bool = True
    metadata: dict = None


@dataclass
class ReapPurchaseResult:
    """Result of a Reap purchase operation."""
    success: bool
    order_id: Optional[str] = None
    tx_hash: Optional[str] = None
    total_usd: float = 0
    status: str = "pending"
    error: Optional[str] = None


class ReapService:
    """
    Reap Protocol Service.
    
    Enables AI agents to discover, verify, and purchase real-world
    products with on-chain settlement.
    """
    
    def __init__(self):
        self.api_url = settings.reap_api_url
        self.contract_address = settings.reap_contract_address
        self.holocron_router = settings.reap_holocron_router
    
    async def search_products(
        self,
        query: str,
        max_price_usd: Optional[float] = None,
        merchant: Optional[str] = None,
        limit: int = 10,
    ) -> list[ReapProduct]:
        """
        Search for products using Reap's agent discovery.
        
        Args:
            query: Product search query
            max_price_usd: Maximum price filter
            merchant: Specific merchant filter
            limit: Maximum results
            
        Returns:
            List of matching products
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "q": query,
                    "limit": limit,
                }
                
                if max_price_usd:
                    params["max_price"] = int(max_price_usd * 100)  # cents
                if merchant:
                    params["merchant"] = merchant
                
                response = await client.get(
                    f"{self.api_url}/v1/products/search",
                    params=params,
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return [
                        ReapProduct(
                            id=p["id"],
                            title=p["title"],
                            price_usd=p["price"] / 100,
                            currency=p.get("currency", "USD"),
                            merchant=p["merchant"],
                            url=p["url"],
                            image_url=p.get("image"),
                            available=p.get("available", True),
                            metadata=p.get("metadata", {}),
                        )
                        for p in data.get("products", [])
                    ]
                else:
                    logger.error(
                        "reap_search_error",
                        status=response.status_code,
                        error=response.text,
                    )
                    return []
                    
        except Exception as e:
            logger.error("reap_search_exception", error=str(e))
            return []
    
    async def get_product_details(self, product_url: str) -> Optional[ReapProduct]:
        """
        Get detailed product information by URL.
        
        Args:
            product_url: URL of the product to fetch
            
        Returns:
            Product details or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/v1/products/index",
                    json={"url": product_url},
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    p = response.json()
                    return ReapProduct(
                        id=p["id"],
                        title=p["title"],
                        price_usd=p["price"] / 100,
                        currency=p.get("currency", "USD"),
                        merchant=p["merchant"],
                        url=p["url"],
                        image_url=p.get("image"),
                        available=p.get("available", True),
                        metadata=p.get("metadata", {}),
                    )
                else:
                    return None
                    
        except Exception as e:
            logger.error("reap_product_error", error=str(e))
            return None
    
    async def verify_inventory(self, product_id: str) -> dict[str, Any]:
        """
        Verify product inventory and availability.
        
        Args:
            product_id: Reap product ID
            
        Returns:
            Inventory status
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/v1/products/{product_id}/inventory",
                    timeout=15.0,
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"available": False, "error": "Unable to verify inventory"}
                    
        except Exception as e:
            logger.error("reap_inventory_error", error=str(e))
            return {"available": False, "error": str(e)}
    
    async def create_cart(
        self,
        agent_wallet: str,
        items: list[dict],
    ) -> dict[str, Any]:
        """
        Create an agentic cart for purchase.
        
        Args:
            agent_wallet: Agent's wallet address
            items: List of items with product_id and quantity
            
        Returns:
            Cart details with total and settlement info
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/v1/cart/create",
                    json={
                        "agent_address": agent_wallet,
                        "items": items,
                    },
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": f"Cart creation failed: {response.text}"}
                    
        except Exception as e:
            logger.error("reap_cart_error", error=str(e))
            return {"error": str(e)}
    
    async def initiate_purchase(
        self,
        cart_id: str,
        agent_wallet: str,
        payment_signature: str,
        shipping_info: Optional[dict] = None,
    ) -> ReapPurchaseResult:
        """
        Initiate a purchase with on-chain settlement.
        
        Args:
            cart_id: Cart ID from create_cart
            agent_wallet: Agent's wallet address
            payment_signature: Signed payment authorization
            shipping_info: Shipping details for physical products
            
        Returns:
            Purchase result with order ID and transaction hash
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "cart_id": cart_id,
                    "agent_address": agent_wallet,
                    "payment_signature": payment_signature,
                }
                
                if shipping_info:
                    payload["shipping"] = shipping_info
                
                response = await client.post(
                    f"{self.api_url}/v1/purchase/initiate",
                    json=payload,
                    timeout=60.0,  # Longer timeout for blockchain settlement
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return ReapPurchaseResult(
                        success=True,
                        order_id=data.get("order_id"),
                        tx_hash=data.get("tx_hash"),
                        total_usd=data.get("total", 0) / 100,
                        status=data.get("status", "pending"),
                    )
                else:
                    return ReapPurchaseResult(
                        success=False,
                        error=response.text,
                    )
                    
        except Exception as e:
            logger.error("reap_purchase_error", error=str(e))
            return ReapPurchaseResult(
                success=False,
                error=str(e),
            )
    
    async def get_order_status(self, order_id: str) -> dict[str, Any]:
        """
        Get status of a purchase order.
        
        Args:
            order_id: Order ID from initiate_purchase
            
        Returns:
            Order status and details
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/v1/orders/{order_id}",
                    timeout=15.0,
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": f"Order not found: {order_id}"}
                    
        except Exception as e:
            logger.error("reap_order_error", error=str(e))
            return {"error": str(e)}
    
    async def discover_agents(
        self,
        capability: Optional[str] = None,
        protocol: Optional[str] = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Discover other AI agents registered with Reap.
        
        Supports MCP, x402, and A2A registries.
        
        Args:
            capability: Filter by capability
            protocol: Filter by protocol (mcp, x402, a2a)
            limit: Maximum results
            
        Returns:
            List of agent registrations
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {"limit": limit}
                if capability:
                    params["capability"] = capability
                if protocol:
                    params["protocol"] = protocol
                
                response = await client.get(
                    f"{self.api_url}/v1/agents/discover",
                    params=params,
                    timeout=15.0,
                )
                
                if response.status_code == 200:
                    return response.json().get("agents", [])
                else:
                    return []
                    
        except Exception as e:
            logger.error("reap_agent_discovery_error", error=str(e))
            return []
    
    def get_contract_addresses(self, network: str = "fuji") -> dict[str, str]:
        """Get Reap contract addresses for a network."""
        addresses = {
            "fuji": {
                "contract": "0x93498CAda15768E301AB8C6fc3Bc17402Ad078AA",
                "holocron_router": "0x2cEC5Bf3a0D3fEe4E13e8f2267176BdD579F4fd8",
            },
            "base_sepolia": {
                "contract": "0x93498CAda15768E301AB8C6fc3Bc17402Ad078AA",
                "holocron_router": "0x2cEC5Bf3a0D3fEe4E13e8f2267176BdD579F4fd8",
            },
        }
        return addresses.get(network, addresses["fuji"])


# Singleton instance
_reap_service: Optional[ReapService] = None


def get_reap_service() -> ReapService:
    """Get Reap service singleton."""
    global _reap_service
    if _reap_service is None:
        _reap_service = ReapService()
    return _reap_service
