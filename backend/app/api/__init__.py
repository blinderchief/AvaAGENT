"""
AvaAgent API Routes Module
"""

from app.api.agents import router as agents_router
from app.api.wallets import router as wallets_router
from app.api.payments import router as payments_router
from app.api.data import router as data_router
from app.api.ai import router as ai_router
from app.api.health import router as health_router
from app.api.intents import router as intents_router
from app.api.commerce import router as commerce_router

__all__ = [
    "agents_router",
    "wallets_router",
    "payments_router",
    "data_router",
    "ai_router",
    "health_router",
    "intents_router",
    "commerce_router",
]
