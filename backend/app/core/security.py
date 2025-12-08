"""
Clerk Authentication & Security Module

JWT verification and user authentication using Clerk.
"""

import httpx
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import get_settings

settings = get_settings()
security = HTTPBearer(auto_error=False)


class ClerkUser(BaseModel):
    """Clerk user model."""
    id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image_url: Optional[str] = None
    metadata: dict = {}

    @property
    def full_name(self) -> str:
        parts = [self.first_name, self.last_name]
        return " ".join(p for p in parts if p) or "Anonymous"


class ClerkJWKSClient:
    """
    JWKS client for Clerk JWT verification.
    
    Fetches and caches public keys from Clerk's JWKS endpoint.
    """
    
    def __init__(self):
        self._keys: dict = {}
        self._last_fetch: Optional[datetime] = None
        self._cache_duration = 3600  # 1 hour

    async def get_public_key(self, kid: str) -> Optional[dict]:
        """Get public key by key ID."""
        now = datetime.now(timezone.utc)
        
        # Refresh cache if needed
        if (
            not self._keys 
            or self._last_fetch is None 
            or (now - self._last_fetch).seconds > self._cache_duration
        ):
            await self._fetch_keys()
        
        return self._keys.get(kid)

    async def _fetch_keys(self) -> None:
        """Fetch JWKS from Clerk."""
        jwks_url = f"{settings.clerk_jwt_issuer}/.well-known/jwks.json"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url)
            response.raise_for_status()
            jwks = response.json()
        
        self._keys = {key["kid"]: key for key in jwks.get("keys", [])}
        self._last_fetch = datetime.now(timezone.utc)


jwks_client = ClerkJWKSClient()


async def verify_clerk_token(token: str) -> dict[str, Any]:
    """
    Verify Clerk JWT token and return payload.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid
    """
    try:
        # Decode header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token header"
            )
        
        # Get public key
        public_key = await jwks_client.get_public_key(kid)
        if not public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key"
            )
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=settings.clerk_jwt_issuer,
            options={"verify_aud": False},  # Clerk doesn't always set audience
        )
        
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> ClerkUser:
    """
    Get current authenticated user from JWT token.
    
    Usage:
        @app.get("/me")
        async def get_me(user: ClerkUser = Depends(get_current_user)):
            return user
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = await verify_clerk_token(credentials.credentials)
    
    # Extract user info from Clerk JWT
    return ClerkUser(
        id=payload.get("sub", ""),
        email=payload.get("email"),
        first_name=payload.get("first_name"),
        last_name=payload.get("last_name"),
        image_url=payload.get("image_url"),
        metadata=payload.get("public_metadata", {}),
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[ClerkUser]:
    """
    Get current user if authenticated, None otherwise.
    
    Usage for optional authentication endpoints.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_role(required_role: str):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @app.get("/admin")
        async def admin_only(user: ClerkUser = Depends(require_role("admin"))):
            ...
    """
    async def check_role(user: ClerkUser = Depends(get_current_user)) -> ClerkUser:
        user_role = user.metadata.get("role", "user")
        if user_role != required_role and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return user
    
    return check_role
