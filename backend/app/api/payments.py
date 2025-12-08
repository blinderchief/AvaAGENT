"""
x402 Payment API Routes

HTTP 402 payment protocol endpoints for micropayments.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ClerkUser, get_current_user, get_optional_user
from app.services.x402_service import get_x402_service, X402PaymentRequest

router = APIRouter(prefix="/payments", tags=["Payments"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class PaymentVerifyRequest(BaseModel):
    """Schema for payment verification."""
    payment_header: str
    expected_price_usd: float
    resource_url: str


class PaymentVerifyResponse(BaseModel):
    """Schema for verification response."""
    valid: bool
    payment_data: Optional[dict] = None
    error: Optional[str] = None


class PaymentSettleRequest(BaseModel):
    """Schema for payment settlement."""
    payment_header: str
    actual_amount_usd: Optional[float] = None


class PaymentSettleResponse(BaseModel):
    """Schema for settlement response."""
    success: bool
    tx_hash: Optional[str] = None
    amount_paid_usd: float = 0
    error: Optional[str] = None


class PaymentRequirementsResponse(BaseModel):
    """Schema for 402 payment requirements."""
    accepts: list[dict]
    error: str
    price: str


class CreatePaymentHeaderRequest(BaseModel):
    """Schema for creating payment header."""
    wallet_address: str
    private_key: str = Field(..., description="Private key (never store server-side in production)")
    resource_url: str
    price_usd: float
    pay_to: str
    network: str = "avalanche_fuji"


class CreatePaymentHeaderResponse(BaseModel):
    """Schema for payment header response."""
    header: str
    expires_at: int


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/verify", response_model=PaymentVerifyResponse)
async def verify_payment(
    data: PaymentVerifyRequest,
):
    """
    Verify an x-payment header.
    
    Use this endpoint to verify payment authorization before
    processing a paid request.
    """
    x402 = get_x402_service()
    
    is_valid, payment_data = await x402.verify_payment(
        payment_header=data.payment_header,
        expected_price_usd=data.expected_price_usd,
        resource_url=data.resource_url,
    )
    
    if is_valid:
        return PaymentVerifyResponse(
            valid=True,
            payment_data=payment_data,
        )
    else:
        return PaymentVerifyResponse(
            valid=False,
            error=payment_data.get("error", "Verification failed"),
        )


@router.post("/settle", response_model=PaymentSettleResponse)
async def settle_payment(
    data: PaymentSettleRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Settle a verified payment on-chain.
    
    Call this after verifying payment and processing the request
    to charge the actual amount used.
    """
    x402 = get_x402_service()
    
    # First verify the payment
    import base64
    import json
    try:
        payment_data = json.loads(base64.b64decode(data.payment_header).decode())
    except Exception as e:
        return PaymentSettleResponse(
            success=False,
            error=f"Invalid payment header: {str(e)}",
        )
    
    result = await x402.settle_payment(
        payment_data=payment_data,
        actual_amount_usd=data.actual_amount_usd,
    )
    
    return PaymentSettleResponse(
        success=result.settled,
        tx_hash=result.tx_hash,
        amount_paid_usd=result.amount_paid_usd,
        error=result.error,
    )


@router.get("/requirements")
async def get_payment_requirements(
    resource_url: str,
    price_usd: float,
    pay_to: str,
    network: str = "avalanche_fuji",
) -> PaymentRequirementsResponse:
    """
    Get x402 payment requirements for a resource.
    
    Use this to understand what payment is needed before
    making a paid request.
    """
    x402 = get_x402_service()
    
    requirements = x402.create_402_response(
        resource_url=resource_url,
        price_usd=price_usd,
        pay_to=pay_to,
        network=network,
    )
    
    return PaymentRequirementsResponse(**requirements["body"])


@router.post("/create-header", response_model=CreatePaymentHeaderResponse)
async def create_payment_header(
    data: CreatePaymentHeaderRequest,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Create an x-payment header for a request.
    
    WARNING: In production, signing should happen client-side.
    This endpoint is for development/testing only.
    """
    x402 = get_x402_service()
    
    import time
    
    header = await x402.create_payment_header(
        wallet_address=data.wallet_address,
        private_key=data.private_key,
        resource_url=data.resource_url,
        price_usd=data.price_usd,
        pay_to=data.pay_to,
        network=data.network,
    )
    
    return CreatePaymentHeaderResponse(
        header=header,
        expires_at=int(time.time()) + 3600,
    )


# ============================================================================
# Example Paid Endpoint
# ============================================================================

@router.get("/paid-resource")
async def paid_resource(
    request: Request,
    x_payment: Optional[str] = Header(None, alias="x-payment"),
):
    """
    Example paid resource endpoint.
    
    Demonstrates the x402 payment flow:
    1. If no payment header, return 402 with requirements
    2. If payment header present, verify and process
    3. Settle payment and return resource
    """
    x402 = get_x402_service()
    
    resource_url = str(request.url)
    price_usd = 0.01  # $0.01 per request
    pay_to = x402.server_wallet
    
    # No payment header - return 402
    if not x_payment:
        requirements = x402.create_402_response(
            resource_url=resource_url,
            price_usd=price_usd,
            pay_to=pay_to,
        )
        
        return Response(
            content=str(requirements["body"]),
            status_code=402,
            headers=requirements["headers"],
            media_type="application/json",
        )
    
    # Verify payment
    is_valid, payment_data = await x402.verify_payment(
        payment_header=x_payment,
        expected_price_usd=price_usd,
        resource_url=resource_url,
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=402,
            detail=payment_data.get("error", "Invalid payment"),
        )
    
    # Settle payment
    result = await x402.settle_payment(payment_data, actual_amount_usd=price_usd)
    
    if not result.settled:
        raise HTTPException(
            status_code=402,
            detail=f"Payment settlement failed: {result.error}",
        )
    
    # Return the paid resource
    return {
        "message": "Access granted to paid resource",
        "payment": {
            "amount_usd": result.amount_paid_usd,
            "tx_hash": result.tx_hash,
        },
        "data": {
            "premium_content": "This is premium content that requires payment.",
            "timestamp": "2024-12-06T00:00:00Z",
        },
    }
