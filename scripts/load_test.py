#!/usr/bin/env python3
"""
Load Test Script

Locust-based load testing for AvaAgent API endpoints.
Tests x402 payment flows, agent operations, and inference endpoints.
"""

import json
import os
import random
import string
import time
from typing import Any
from uuid import uuid4

from locust import HttpUser, task, between, events
from locust.runners import MasterRunner, WorkerRunner

# ============================================================================
# Configuration
# ============================================================================

# API Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
API_VERSION = "/api/v1"

# Test data
TEST_WALLET_ADDRESSES = [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD00",
    "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    "0xdD870fA1b7C4700F2BD7f44238821C26f7392148",
    "0x583031D1113aD414F02576BD6afaBfb302140225",
    "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
]

AGENT_TYPES = ["defi", "research", "nft", "commerce", "governance"]
AGENT_MODELS = ["gemini-2.0-flash", "gemini-1.5-pro"]

SAMPLE_QUERIES = [
    "What is the current TVL on Avalanche?",
    "Find me the best yield farming opportunities",
    "Analyze AVAX price trends for the past week",
    "Search for rare NFTs under 10 AVAX",
    "Compare gas prices across L2 networks",
    "What are the top DEXs by volume today?",
    "Monitor my portfolio performance",
    "Find arbitrage opportunities between DEXs",
]

# x402 Payment test data
X402_PAYMENT_AMOUNTS = [
    "1000000",      # 1 USDC (6 decimals)
    "5000000",      # 5 USDC
    "10000000",     # 10 USDC
    "100000000",    # 100 USDC
]

# ============================================================================
# Utility Functions
# ============================================================================

def random_string(length: int = 10) -> str:
    """Generate a random string."""
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def random_wallet() -> str:
    """Get a random test wallet address."""
    return random.choice(TEST_WALLET_ADDRESSES)


def random_agent_type() -> str:
    """Get a random agent type."""
    return random.choice(AGENT_TYPES)


def random_query() -> str:
    """Get a random sample query."""
    return random.choice(SAMPLE_QUERIES)


def create_agent_payload() -> dict[str, Any]:
    """Create a random agent payload."""
    return {
        "name": f"LoadTest Agent {random_string(6)}",
        "description": f"Load test agent created at {time.time()}",
        "agent_type": random_agent_type(),
        "model_id": random.choice(AGENT_MODELS),
        "config": {
            "test_mode": True,
            "created_by": "load_test"
        },
        "policy": {
            "spend_limit_usd": random.uniform(10, 1000),
            "spend_limit_period": random.choice(["daily", "weekly", "monthly"]),
            "allowed_contracts": [],
            "require_approval": random.choice([True, False])
        }
    }


def create_x402_payment_payload() -> dict[str, Any]:
    """Create an x402 payment request payload."""
    return {
        "payment_required": {
            "x402_version": 1,
            "accepts": [{
                "scheme": "exact",
                "network": "avalanche-fuji",
                "max_amount_required": random.choice(X402_PAYMENT_AMOUNTS),
                "resource": f"/api/v1/inference/{uuid4()}",
                "pay_to": "0x5425890298aed601595a70AB815c96711a31Bc65",
                "extra": {"description": "Load test payment"}
            }],
            "error": None
        },
        "wallet_address": random_wallet()
    }


# ============================================================================
# Load Test User Classes
# ============================================================================

class AvaAgentUser(HttpUser):
    """
    Main load test user simulating typical AvaAgent usage patterns.
    """
    
    host = API_BASE_URL
    wait_time = between(1, 5)
    
    def on_start(self):
        """Initialize user session."""
        self.agent_ids = []
        self.auth_token = os.getenv("TEST_AUTH_TOKEN", "test-token")
        self.headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    @task(3)
    def health_check(self):
        """Check API health endpoint."""
        with self.client.get(
            "/health",
            name="Health Check",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed: {response.status_code}")
    
    @task(5)
    def list_agents(self):
        """List all agents."""
        with self.client.get(
            f"{API_VERSION}/agents",
            headers=self.headers,
            name="List Agents",
            catch_response=True
        ) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"List agents failed: {response.status_code}")
    
    @task(2)
    def create_agent(self):
        """Create a new agent."""
        payload = create_agent_payload()
        
        with self.client.post(
            f"{API_VERSION}/agents",
            headers=self.headers,
            json=payload,
            name="Create Agent",
            catch_response=True
        ) as response:
            if response.status_code == 201:
                data = response.json()
                self.agent_ids.append(data.get("id"))
                response.success()
            elif response.status_code == 401:
                response.success()  # Expected without valid auth
            else:
                response.failure(f"Create agent failed: {response.status_code}")
    
    @task(3)
    def get_agent(self):
        """Get a specific agent."""
        if not self.agent_ids:
            return
        
        agent_id = random.choice(self.agent_ids)
        
        with self.client.get(
            f"{API_VERSION}/agents/{agent_id}",
            headers=self.headers,
            name="Get Agent",
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 404]:
                response.success()
            else:
                response.failure(f"Get agent failed: {response.status_code}")
    
    @task(4)
    def inference_request(self):
        """Send an inference request."""
        payload = {
            "query": random_query(),
            "agent_id": random.choice(self.agent_ids) if self.agent_ids else None,
            "stream": False
        }
        
        with self.client.post(
            f"{API_VERSION}/inference",
            headers=self.headers,
            json=payload,
            name="Inference Request",
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 402, 500]:
                response.success()
            else:
                response.failure(f"Inference failed: {response.status_code}")
    
    @task(1)
    def delete_agent(self):
        """Delete an agent (cleanup)."""
        if not self.agent_ids:
            return
        
        agent_id = self.agent_ids.pop()
        
        with self.client.delete(
            f"{API_VERSION}/agents/{agent_id}",
            headers=self.headers,
            name="Delete Agent",
            catch_response=True
        ) as response:
            if response.status_code in [200, 204, 401, 404]:
                response.success()
            else:
                response.failure(f"Delete agent failed: {response.status_code}")


class X402PaymentUser(HttpUser):
    """
    Load test user focused on x402 payment flows.
    """
    
    host = API_BASE_URL
    wait_time = between(2, 8)
    
    def on_start(self):
        """Initialize payment user session."""
        self.wallet = random_wallet()
        self.auth_token = os.getenv("TEST_AUTH_TOKEN", "test-token")
        self.headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
            "X-Wallet-Address": self.wallet
        }
    
    @task(5)
    def check_payment_required(self):
        """Check if payment is required for a resource."""
        resource_id = str(uuid4())
        
        with self.client.get(
            f"{API_VERSION}/x402/check/{resource_id}",
            headers=self.headers,
            name="Check Payment Required",
            catch_response=True
        ) as response:
            if response.status_code in [200, 402, 404]:
                response.success()
            else:
                response.failure(f"Payment check failed: {response.status_code}")
    
    @task(3)
    def create_payment_intent(self):
        """Create a payment intent."""
        payload = {
            "amount": random.choice(X402_PAYMENT_AMOUNTS),
            "currency": "USDC",
            "resource": f"/api/v1/inference/{uuid4()}",
            "wallet_address": self.wallet
        }
        
        with self.client.post(
            f"{API_VERSION}/x402/intent",
            headers=self.headers,
            json=payload,
            name="Create Payment Intent",
            catch_response=True
        ) as response:
            if response.status_code in [200, 201, 401, 500]:
                response.success()
            else:
                response.failure(f"Create intent failed: {response.status_code}")
    
    @task(2)
    def verify_payment(self):
        """Verify a payment."""
        payload = {
            "tx_hash": f"0x{random_string(64)}",
            "resource": f"/api/v1/inference/{uuid4()}",
            "wallet_address": self.wallet
        }
        
        with self.client.post(
            f"{API_VERSION}/x402/verify",
            headers=self.headers,
            json=payload,
            name="Verify Payment",
            catch_response=True
        ) as response:
            if response.status_code in [200, 400, 401, 404, 500]:
                response.success()
            else:
                response.failure(f"Verify payment failed: {response.status_code}")
    
    @task(1)
    def get_payment_history(self):
        """Get payment history for wallet."""
        with self.client.get(
            f"{API_VERSION}/x402/history?wallet={self.wallet}",
            headers=self.headers,
            name="Payment History",
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 404]:
                response.success()
            else:
                response.failure(f"History failed: {response.status_code}")


class ReapCommerceUser(HttpUser):
    """
    Load test user for Reap Protocol commerce flows.
    """
    
    host = API_BASE_URL
    wait_time = between(3, 10)
    
    def on_start(self):
        """Initialize commerce user session."""
        self.cart_id = None
        self.auth_token = os.getenv("TEST_AUTH_TOKEN", "test-token")
        self.headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    @task(5)
    def search_products(self):
        """Search for products."""
        queries = ["electronics", "gaming", "software", "subscription", "gift card"]
        
        with self.client.get(
            f"{API_VERSION}/reap/products?q={random.choice(queries)}",
            headers=self.headers,
            name="Search Products",
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 404, 500]:
                response.success()
            else:
                response.failure(f"Search failed: {response.status_code}")
    
    @task(3)
    def add_to_cart(self):
        """Add item to cart."""
        payload = {
            "product_id": f"product-{random_string(8)}",
            "quantity": random.randint(1, 5)
        }
        
        with self.client.post(
            f"{API_VERSION}/reap/cart/add",
            headers=self.headers,
            json=payload,
            name="Add to Cart",
            catch_response=True
        ) as response:
            if response.status_code in [200, 201, 401, 404, 500]:
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.cart_id = data.get("cart_id")
                response.success()
            else:
                response.failure(f"Add to cart failed: {response.status_code}")
    
    @task(2)
    def view_cart(self):
        """View current cart."""
        if not self.cart_id:
            return
        
        with self.client.get(
            f"{API_VERSION}/reap/cart/{self.cart_id}",
            headers=self.headers,
            name="View Cart",
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 404]:
                response.success()
            else:
                response.failure(f"View cart failed: {response.status_code}")
    
    @task(1)
    def checkout(self):
        """Process checkout."""
        if not self.cart_id:
            return
        
        payload = {
            "cart_id": self.cart_id,
            "wallet_address": random_wallet(),
            "shipping_address": {
                "name": "Load Test User",
                "address": "123 Test Street",
                "city": "Test City",
                "country": "US"
            }
        }
        
        with self.client.post(
            f"{API_VERSION}/reap/checkout",
            headers=self.headers,
            json=payload,
            name="Checkout",
            catch_response=True
        ) as response:
            if response.status_code in [200, 201, 400, 401, 402, 500]:
                if response.status_code in [200, 201]:
                    self.cart_id = None  # Reset cart after checkout
                response.success()
            else:
                response.failure(f"Checkout failed: {response.status_code}")


# ============================================================================
# Event Handlers
# ============================================================================

@events.init.add_listener
def on_locust_init(environment, **kwargs):
    """Initialize load test environment."""
    if isinstance(environment.runner, MasterRunner):
        print("🚀 Load test master started")
    elif isinstance(environment.runner, WorkerRunner):
        print("👷 Load test worker started")
    else:
        print("🧪 Load test started in standalone mode")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Handle test start."""
    print("=" * 60)
    print("🔥 AvaAgent Load Test Starting")
    print(f"📍 Target: {API_BASE_URL}")
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Handle test stop."""
    print("=" * 60)
    print("✅ AvaAgent Load Test Completed")
    print("=" * 60)


# ============================================================================
# CLI Configuration
# ============================================================================

if __name__ == "__main__":
    import subprocess
    import sys
    
    # Default Locust arguments
    default_args = [
        "locust",
        "-f", __file__,
        "--host", API_BASE_URL,
        "--users", "10",
        "--spawn-rate", "2",
        "--run-time", "60s",
        "--headless",
        "--only-summary"
    ]
    
    # Allow overriding with command line args
    args = sys.argv[1:] if len(sys.argv) > 1 else default_args[1:]
    
    print("=" * 60)
    print("🧪 AvaAgent Load Test Runner")
    print("=" * 60)
    print(f"\nUsage: python {__file__} [locust args]")
    print("\nExamples:")
    print(f"  python {__file__}                           # Run with defaults")
    print(f"  python {__file__} --web-host 0.0.0.0        # Run with web UI")
    print(f"  python {__file__} --users 50 --spawn-rate 5 # Custom load")
    print()
    
    # Run Locust
    subprocess.run(["locust", "-f", __file__] + args)
