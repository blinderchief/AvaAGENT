"""
Commerce API Routes

Reap Protocol integration for real-world purchases.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ClerkUser, get_current_user
from app.services.reap_service import get_reap_service

router = APIRouter(prefix="/commerce", tags=["Commerce"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ProductSearchRequest(BaseModel):
    """Schema for product search."""
    query: str = Field(..., min_length=1, max_length=500)
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None


class ProductItem(BaseModel):
    """Schema for product item."""
    id: str
    name: str
    description: str
    price_usd: float
    price_crypto: Optional[dict] = None
    image_url: Optional[str] = None
    category: str
    merchant: str
    availability: bool


class ProductSearchResponse(BaseModel):
    """Schema for product search response."""
    products: list[ProductItem]
    total: int
    page: int
    per_page: int


class PurchaseRequest(BaseModel):
    """Schema for purchase request."""
    product_id: str
    quantity: int = Field(1, ge=1, le=10)
    shipping_address: dict
    wallet_id: UUID
    payment_method: str = "crypto"


class PurchaseResponse(BaseModel):
    """Schema for purchase response."""
    order_id: str
    status: str
    total_usd: float
    payment_status: str
    tx_hash: Optional[str] = None
    estimated_delivery: Optional[str] = None
    error: Optional[str] = None


class OrderStatus(BaseModel):
    """Schema for order status."""
    order_id: str
    status: str
    payment_status: str
    shipping_status: Optional[str] = None
    tracking_number: Optional[str] = None
    items: list[dict]
    total_usd: float


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/search", response_model=ProductSearchResponse)
async def search_products(
    data: ProductSearchRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Search for products.
    
    Uses Reap Protocol to find products available
    for crypto purchase.
    """
    reap = get_reap_service()
    
    result = await reap.search_products(
        query=data.query,
        category=data.category,
        min_price=data.min_price,
        max_price=data.max_price,
    )
    
    products = [
        ProductItem(
            id=p.get("id", ""),
            name=p.get("name", ""),
            description=p.get("description", ""),
            price_usd=p.get("price_usd", 0),
            price_crypto=p.get("price_crypto"),
            image_url=p.get("image_url"),
            category=p.get("category", ""),
            merchant=p.get("merchant", ""),
            availability=p.get("availability", True),
        )
        for p in result.get("products", [])
    ]
    
    return ProductSearchResponse(
        products=products,
        total=result.get("total", len(products)),
        page=1,
        per_page=20,
    )


@router.get("/product/{product_id}")
async def get_product(
    product_id: str,
    user: ClerkUser = Depends(get_current_user),
):
    """Get product details."""
    reap = get_reap_service()
    
    result = await reap.get_product(product_id)
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.post("/purchase", response_model=PurchaseResponse)
async def create_purchase(
    data: PurchaseRequest,
    user: ClerkUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a purchase order.
    
    Initiates crypto payment through Reap Protocol
    for real-world product delivery.
    """
    reap = get_reap_service()
    
    # Verify wallet ownership
    from sqlalchemy import select
    from app.models.wallet import Wallet
    
    result = await db.execute(
        select(Wallet).where(
            Wallet.id == data.wallet_id,
            Wallet.user_id == user.id,
        )
    )
    wallet = result.scalar_one_or_none()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Create order
    order_result = await reap.create_order(
        product_id=data.product_id,
        quantity=data.quantity,
        shipping_address=data.shipping_address,
        wallet_address=wallet.address,
    )
    
    if order_result.get("error"):
        return PurchaseResponse(
            order_id="",
            status="failed",
            total_usd=0,
            payment_status="failed",
            error=order_result["error"],
        )
    
    return PurchaseResponse(
        order_id=order_result.get("order_id", ""),
        status=order_result.get("status", "pending"),
        total_usd=order_result.get("total_usd", 0),
        payment_status=order_result.get("payment_status", "pending"),
        tx_hash=order_result.get("tx_hash"),
        estimated_delivery=order_result.get("estimated_delivery"),
    )


@router.get("/orders", response_model=list[OrderStatus])
async def list_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: ClerkUser = Depends(get_current_user),
):
    """List user's orders."""
    reap = get_reap_service()
    
    result = await reap.list_orders(
        user_id=user.id,
        status=status,
        limit=limit,
    )
    
    return [
        OrderStatus(
            order_id=o.get("order_id", ""),
            status=o.get("status", ""),
            payment_status=o.get("payment_status", ""),
            shipping_status=o.get("shipping_status"),
            tracking_number=o.get("tracking_number"),
            items=o.get("items", []),
            total_usd=o.get("total_usd", 0),
        )
        for o in result.get("orders", [])
    ]


@router.get("/orders/{order_id}", response_model=OrderStatus)
async def get_order(
    order_id: str,
    user: ClerkUser = Depends(get_current_user),
):
    """Get order details."""
    reap = get_reap_service()
    
    result = await reap.get_order(order_id)
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    
    return OrderStatus(
        order_id=result.get("order_id", ""),
        status=result.get("status", ""),
        payment_status=result.get("payment_status", ""),
        shipping_status=result.get("shipping_status"),
        tracking_number=result.get("tracking_number"),
        items=result.get("items", []),
        total_usd=result.get("total_usd", 0),
    )


@router.post("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    user: ClerkUser = Depends(get_current_user),
):
    """Cancel an order."""
    reap = get_reap_service()
    
    result = await reap.cancel_order(order_id)
    
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {"message": "Order cancelled successfully"}


@router.get("/categories")
async def list_categories(
    user: ClerkUser = Depends(get_current_user),
):
    """List available product categories."""
    reap = get_reap_service()
    
    result = await reap.get_categories()
    
    return {
        "categories": result.get("categories", []),
    }


@router.get("/merchants")
async def list_merchants(
    category: Optional[str] = Query(None),
    user: ClerkUser = Depends(get_current_user),
):
    """List available merchants."""
    reap = get_reap_service()
    
    result = await reap.get_merchants(category=category)
    
    return {
        "merchants": result.get("merchants", []),
    }
