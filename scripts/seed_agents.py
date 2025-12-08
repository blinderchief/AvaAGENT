#!/usr/bin/env python3
"""
Seed Agents Script

Pre-populates the database with demo agents for hackathon presentation.
Creates realistic AI agents with various configurations and policies.
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# ============================================================================
# Configuration
# ============================================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/avaagent"
)

# Convert postgres:// to postgresql+asyncpg:// if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# ============================================================================
# Demo Agent Data
# ============================================================================

DEMO_AGENTS = [
    {
        "name": "TradingBot Alpha",
        "description": "Autonomous DeFi trading agent specialized in yield optimization across Avalanche DEXs. Executes swaps, provides liquidity, and manages positions.",
        "agent_type": "defi",
        "model_id": "gemini-2.0-flash",
        "status": "active",
        "config": {
            "strategy": "yield_optimization",
            "max_slippage": 0.5,
            "preferred_dexs": ["trader_joe", "pangolin", "platypus"],
            "rebalance_threshold": 5.0,
            "gas_price_limit": 50
        },
        "policy": {
            "spend_limit_usd": 1000.0,
            "spend_limit_period": "daily",
            "allowed_contracts": [
                "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",  # TraderJoe Router
                "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106",  # Pangolin Router
            ],
            "allowed_tokens": ["AVAX", "USDC", "USDT", "WAVAX", "JOE"],
            "require_approval": False,
            "time_lock_hours": 0
        },
        "metrics": {
            "total_transactions": 247,
            "success_rate": 98.4,
            "total_volume_usd": 45230.50,
            "avg_response_time_ms": 1250
        }
    },
    {
        "name": "Research Assistant",
        "description": "Knowledge-augmented AI agent that queries multiple data sources via Turf Network to provide comprehensive research and analysis.",
        "agent_type": "research",
        "model_id": "gemini-2.0-flash",
        "status": "active",
        "config": {
            "data_sources": ["turf", "defillama", "coingecko", "dune"],
            "max_queries_per_request": 5,
            "enable_caching": True,
            "cache_ttl_minutes": 15
        },
        "policy": {
            "spend_limit_usd": 50.0,
            "spend_limit_period": "daily",
            "allowed_contracts": [],
            "allowed_tokens": ["USDC"],
            "require_approval": False,
            "time_lock_hours": 0
        },
        "metrics": {
            "total_transactions": 1523,
            "success_rate": 99.1,
            "total_volume_usd": 152.30,
            "avg_response_time_ms": 2100
        }
    },
    {
        "name": "NFT Curator",
        "description": "Intelligent NFT agent that discovers, analyzes, and curates digital art collections. Can execute purchases based on configured criteria.",
        "agent_type": "nft",
        "model_id": "gemini-2.0-flash",
        "status": "active",
        "config": {
            "collections_tracked": ["joepegs", "campfire", "kalao"],
            "price_alert_threshold": 0.1,
            "rarity_filter": "legendary",
            "auto_buy_enabled": False
        },
        "policy": {
            "spend_limit_usd": 500.0,
            "spend_limit_period": "weekly",
            "allowed_contracts": [
                "0x9A7f3c12ef0F3b22F57D67A8E6B59B7e5f3B5B8d",  # JoePegs
            ],
            "allowed_tokens": ["AVAX", "WAVAX"],
            "require_approval": True,
            "time_lock_hours": 24
        },
        "metrics": {
            "total_transactions": 34,
            "success_rate": 94.1,
            "total_volume_usd": 2340.00,
            "avg_response_time_ms": 3200
        }
    },
    {
        "name": "Shopping Concierge",
        "description": "Reap Protocol-powered commerce agent that browses products, compares prices, and executes purchases on behalf of users.",
        "agent_type": "commerce",
        "model_id": "gemini-2.0-flash",
        "status": "active",
        "config": {
            "reap_endpoint": "https://avax2.api.reap.deals",
            "price_comparison_enabled": True,
            "preferred_merchants": [],
            "max_items_per_order": 10
        },
        "policy": {
            "spend_limit_usd": 200.0,
            "spend_limit_period": "daily",
            "allowed_contracts": [
                "0x93498CAda15768E301AB8C6fc3Bc17402Ad078AA",  # Reap Protocol
            ],
            "allowed_tokens": ["USDC", "AVAX"],
            "require_approval": True,
            "time_lock_hours": 1
        },
        "metrics": {
            "total_transactions": 89,
            "success_rate": 96.6,
            "total_volume_usd": 4567.80,
            "avg_response_time_ms": 1800
        }
    },
    {
        "name": "Portfolio Guardian",
        "description": "Risk management agent that monitors portfolio health, sets stop-losses, and rebalances positions to maintain target allocations.",
        "agent_type": "defi",
        "model_id": "gemini-2.0-flash",
        "status": "active",
        "config": {
            "target_allocation": {
                "AVAX": 40,
                "USDC": 30,
                "BTC.b": 20,
                "ETH": 10
            },
            "rebalance_threshold_percent": 5,
            "stop_loss_percent": 15,
            "take_profit_percent": 50
        },
        "policy": {
            "spend_limit_usd": 5000.0,
            "spend_limit_period": "weekly",
            "allowed_contracts": [
                "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",  # TraderJoe
                "0xdef1c0ded9bec7f1a1670819833240f027b25eff",  # 0x Protocol
            ],
            "allowed_tokens": ["AVAX", "USDC", "BTC.b", "ETH", "WAVAX"],
            "require_approval": False,
            "time_lock_hours": 0
        },
        "metrics": {
            "total_transactions": 156,
            "success_rate": 99.4,
            "total_volume_usd": 78450.00,
            "avg_response_time_ms": 980
        }
    },
    {
        "name": "Social Analyst",
        "description": "Sentiment analysis agent that monitors social media, news, and on-chain data to provide market insights and alerts.",
        "agent_type": "research",
        "model_id": "gemini-2.0-flash",
        "status": "idle",
        "config": {
            "data_sources": ["twitter", "reddit", "discord", "telegram"],
            "sentiment_threshold": 0.7,
            "alert_keywords": ["AVAX", "Avalanche", "subnet", "defi"],
            "update_interval_minutes": 5
        },
        "policy": {
            "spend_limit_usd": 25.0,
            "spend_limit_period": "daily",
            "allowed_contracts": [],
            "allowed_tokens": ["USDC"],
            "require_approval": False,
            "time_lock_hours": 0
        },
        "metrics": {
            "total_transactions": 2341,
            "success_rate": 99.8,
            "total_volume_usd": 58.50,
            "avg_response_time_ms": 450
        }
    },
    {
        "name": "Governance Delegate",
        "description": "DAO governance agent that analyzes proposals, participates in voting, and manages delegation across multiple protocols.",
        "agent_type": "governance",
        "model_id": "gemini-2.0-flash",
        "status": "active",
        "config": {
            "protocols": ["aave", "benqi", "trader_joe"],
            "voting_strategy": "conservative",
            "auto_delegate": True,
            "proposal_notification": True
        },
        "policy": {
            "spend_limit_usd": 100.0,
            "spend_limit_period": "monthly",
            "allowed_contracts": [
                "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5",  # BENQI Governance
            ],
            "allowed_tokens": ["QI", "sAVAX"],
            "require_approval": True,
            "time_lock_hours": 48
        },
        "metrics": {
            "total_transactions": 23,
            "success_rate": 100.0,
            "total_volume_usd": 0.00,
            "avg_response_time_ms": 2800
        }
    },
    {
        "name": "Bridge Automator",
        "description": "Cross-chain bridge agent that monitors balances and automatically bridges assets between Avalanche and other networks.",
        "agent_type": "bridge",
        "model_id": "gemini-2.0-flash",
        "status": "paused",
        "config": {
            "supported_chains": ["ethereum", "polygon", "arbitrum", "avalanche"],
            "bridge_providers": ["layerzero", "stargate", "multichain"],
            "min_bridge_amount_usd": 100,
            "gas_optimization": True
        },
        "policy": {
            "spend_limit_usd": 10000.0,
            "spend_limit_period": "weekly",
            "allowed_contracts": [
                "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd",  # Stargate Router
            ],
            "allowed_tokens": ["USDC", "USDT", "ETH", "AVAX"],
            "require_approval": True,
            "time_lock_hours": 6
        },
        "metrics": {
            "total_transactions": 67,
            "success_rate": 97.0,
            "total_volume_usd": 125670.00,
            "avg_response_time_ms": 45000
        }
    }
]

# Demo intents for each agent
DEMO_INTENTS = [
    {
        "action": "swap",
        "status": "completed",
        "params": {"from": "AVAX", "to": "USDC", "amount": 10.0},
        "result": {"tx_hash": "0x1234...5678", "received": 245.50}
    },
    {
        "action": "query",
        "status": "completed",
        "params": {"source": "turf", "query": "AVAX price history"},
        "result": {"data_points": 365, "cost_usdc": 0.01}
    },
    {
        "action": "analyze",
        "status": "completed",
        "params": {"collection": "joepegs", "rarity": "legendary"},
        "result": {"items_found": 23, "avg_price": 12.5}
    },
    {
        "action": "purchase",
        "status": "pending",
        "params": {"product_id": "reap-123", "quantity": 1},
        "result": None
    },
    {
        "action": "rebalance",
        "status": "completed",
        "params": {"portfolio_id": "main", "threshold": 5},
        "result": {"trades_executed": 3, "gas_spent": 0.05}
    }
]

# ============================================================================
# Database Operations
# ============================================================================

async def create_demo_user(session: AsyncSession, clerk_user_id: str) -> str:
    """Create or get demo user."""
    user_id = str(uuid4())
    
    # Check if user exists
    result = await session.execute(
        text("SELECT id FROM users WHERE clerk_user_id = :clerk_id"),
        {"clerk_id": clerk_user_id}
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing
    
    # Create user
    await session.execute(
        text("""
            INSERT INTO users (id, clerk_user_id, email, created_at, updated_at)
            VALUES (:id, :clerk_id, :email, :created_at, :updated_at)
        """),
        {
            "id": user_id,
            "clerk_id": clerk_user_id,
            "email": "demo@avaagent.xyz",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    )
    
    return user_id


async def create_agent(
    session: AsyncSession,
    user_id: str,
    agent_data: dict[str, Any]
) -> str:
    """Create an agent in the database."""
    import json
    
    agent_id = str(uuid4())
    now = datetime.utcnow()
    
    await session.execute(
        text("""
            INSERT INTO agents (
                id, user_id, name, description, agent_type, model_id,
                status, config, policy, metrics, created_at, updated_at
            )
            VALUES (
                :id, :user_id, :name, :description, :agent_type, :model_id,
                :status, :config, :policy, :metrics, :created_at, :updated_at
            )
        """),
        {
            "id": agent_id,
            "user_id": user_id,
            "name": agent_data["name"],
            "description": agent_data["description"],
            "agent_type": agent_data["agent_type"],
            "model_id": agent_data["model_id"],
            "status": agent_data["status"],
            "config": json.dumps(agent_data["config"]),
            "policy": json.dumps(agent_data["policy"]),
            "metrics": json.dumps(agent_data["metrics"]),
            "created_at": now - timedelta(days=30),
            "updated_at": now
        }
    )
    
    return agent_id


async def create_intent(
    session: AsyncSession,
    agent_id: str,
    intent_data: dict[str, Any],
    created_offset_hours: int
) -> str:
    """Create an intent for an agent."""
    import json
    
    intent_id = str(uuid4())
    now = datetime.utcnow()
    created_at = now - timedelta(hours=created_offset_hours)
    
    await session.execute(
        text("""
            INSERT INTO intents (
                id, agent_id, action, status, params, result,
                created_at, updated_at
            )
            VALUES (
                :id, :agent_id, :action, :status, :params, :result,
                :created_at, :updated_at
            )
        """),
        {
            "id": intent_id,
            "agent_id": agent_id,
            "action": intent_data["action"],
            "status": intent_data["status"],
            "params": json.dumps(intent_data["params"]),
            "result": json.dumps(intent_data["result"]) if intent_data["result"] else None,
            "created_at": created_at,
            "updated_at": created_at
        }
    )
    
    return intent_id


async def seed_database():
    """Main seeding function."""
    print("🌱 Starting database seeding...")
    print(f"📦 Using database: {DATABASE_URL[:50]}...")
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Create demo user
            print("\n👤 Creating demo user...")
            user_id = await create_demo_user(session, "demo_user_hackathon")
            print(f"   User ID: {user_id}")
            
            # Create agents
            print(f"\n🤖 Creating {len(DEMO_AGENTS)} demo agents...")
            agent_ids = []
            
            for i, agent_data in enumerate(DEMO_AGENTS, 1):
                agent_id = await create_agent(session, user_id, agent_data)
                agent_ids.append(agent_id)
                print(f"   [{i}/{len(DEMO_AGENTS)}] {agent_data['name']} ({agent_data['status']})")
            
            # Create intents for each agent
            print(f"\n📝 Creating demo intents...")
            intent_count = 0
            
            for agent_id in agent_ids:
                for j, intent_data in enumerate(DEMO_INTENTS):
                    await create_intent(
                        session,
                        agent_id,
                        intent_data,
                        created_offset_hours=(j + 1) * 24
                    )
                    intent_count += 1
            
            print(f"   Created {intent_count} intents")
            
            # Commit transaction
            await session.commit()
            
            print("\n✅ Database seeding completed successfully!")
            print(f"   - Users: 1")
            print(f"   - Agents: {len(DEMO_AGENTS)}")
            print(f"   - Intents: {intent_count}")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error during seeding: {e}")
            raise
        finally:
            await engine.dispose()


async def clear_demo_data():
    """Clear all demo data from the database."""
    print("🧹 Clearing demo data...")
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Delete intents first (foreign key constraint)
            result = await session.execute(
                text("""
                    DELETE FROM intents WHERE agent_id IN (
                        SELECT id FROM agents WHERE user_id IN (
                            SELECT id FROM users WHERE clerk_user_id = 'demo_user_hackathon'
                        )
                    )
                """)
            )
            print(f"   Deleted {result.rowcount} intents")
            
            # Delete agents
            result = await session.execute(
                text("""
                    DELETE FROM agents WHERE user_id IN (
                        SELECT id FROM users WHERE clerk_user_id = 'demo_user_hackathon'
                    )
                """)
            )
            print(f"   Deleted {result.rowcount} agents")
            
            # Delete demo user
            result = await session.execute(
                text("DELETE FROM users WHERE clerk_user_id = 'demo_user_hackathon'")
            )
            print(f"   Deleted {result.rowcount} users")
            
            await session.commit()
            print("✅ Demo data cleared successfully!")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error clearing data: {e}")
            raise
        finally:
            await engine.dispose()


# ============================================================================
# CLI
# ============================================================================

def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Seed AvaAgent database with demo data"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing demo data before seeding"
    )
    parser.add_argument(
        "--clear-only",
        action="store_true",
        help="Only clear demo data, don't seed"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🚀 AvaAgent Database Seeder")
    print("=" * 60)
    
    if args.clear_only:
        asyncio.run(clear_demo_data())
    elif args.clear:
        asyncio.run(clear_demo_data())
        asyncio.run(seed_database())
    else:
        asyncio.run(seed_database())


if __name__ == "__main__":
    main()
