"""
x402 Payment Service

HTTP 402 payment protocol implementation for agent micropayments.
Uses Thirdweb facilitator for on-chain settlement.
"""

import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any, Optional

import httpx
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


@dataclass
class X402PaymentRequest:
    """x402 payment request structure."""
    resource_url: str
    method: str
    price_usd: float
    pay_to: str
    network: str
    asset: str = "USDC"
    max_amount_usd: Optional[float] = None


@dataclass
class X402PaymentResponse:
    """x402 payment response structure."""
    status: int
    settled: bool
    tx_hash: Optional[str] = None
    amount_paid_usd: float = 0
    error: Optional[str] = None


class X402Service:
    """
    x402 Payment Protocol Service.
    
    Implements HTTP 402 Payment Required flow with Thirdweb facilitator
    for settling micropayments on Avalanche and Kite networks.
    """
    
    # Supported networks
    NETWORKS = {
        "avalanche": {
            "chain_id": 43114,
            "rpc": "https://api.avax.network/ext/bc/C/rpc",
            "usdc": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        },
        "avalanche_fuji": {
            "chain_id": 43113,
            "rpc": "https://api.avax-test.network/ext/bc/C/rpc",
            "usdc": "0x5425890298aed601595a70AB815c96711a31Bc65",
        },
        "kite_testnet": {
            "chain_id": 2368,
            "rpc": "https://rpc-testnet.gokite.ai",
            "usdc": "0x0000000000000000000000000000000000000000",  # Native KITE
        },
    }
    
    def __init__(self):
        self.client_id = settings.thirdweb_client_id
        self.secret_key = settings.thirdweb_secret_key
        self.server_wallet = settings.thirdweb_server_wallet_address
        self.facilitator_address = settings.x402_facilitator_address
        self.price_per_token_wei = settings.x402_price_per_token_wei
        
        # Initialize Web3 instances
        self.web3_instances = {}
        for network, config in self.NETWORKS.items():
            self.web3_instances[network] = Web3(Web3.HTTPProvider(config["rpc"]))
    
    async def create_payment_header(
        self,
        wallet_address: str,
        private_key: str,
        resource_url: str,
        price_usd: float,
        pay_to: str,
        network: str = "avalanche_fuji",
    ) -> str:
        """
        Create x-payment header for x402 requests.
        
        Args:
            wallet_address: Payer's wallet address
            private_key: Payer's private key for signing
            resource_url: URL of the resource being paid for
            price_usd: Price in USD
            pay_to: Recipient address
            network: Target network
            
        Returns:
            Base64-encoded payment header
        """
        network_config = self.NETWORKS.get(network)
        if not network_config:
            raise ValueError(f"Unsupported network: {network}")
        
        # Convert USD to token amount (USDC has 6 decimals)
        amount_wei = int(price_usd * 1_000_000)
        
        # Create payment data structure
        payment_data = {
            "version": "1",
            "resource": resource_url,
            "amount": str(amount_wei),
            "asset": network_config["usdc"],
            "payTo": pay_to,
            "chainId": network_config["chain_id"],
            "validUntil": int(time.time()) + 3600,  # 1 hour validity
            "nonce": hashlib.sha256(f"{time.time()}{wallet_address}".encode()).hexdigest()[:16],
        }
        
        # Create signature
        message = json.dumps(payment_data, sort_keys=True)
        message_hash = encode_defunct(text=message)
        signed = Account.sign_message(message_hash, private_key)
        
        # Add signature to payment data
        payment_data["signature"] = signed.signature.hex()
        payment_data["signer"] = wallet_address
        
        # Encode as base64
        import base64
        header_value = base64.b64encode(json.dumps(payment_data).encode()).decode()
        
        return header_value
    
    async def verify_payment(
        self,
        payment_header: str,
        expected_price_usd: float,
        resource_url: str,
    ) -> tuple[bool, dict[str, Any]]:
        """
        Verify x-payment header from incoming request.
        
        Args:
            payment_header: Base64-encoded payment header
            expected_price_usd: Expected payment amount
            resource_url: Resource URL being accessed
            
        Returns:
            Tuple of (is_valid, payment_data)
        """
        try:
            import base64
            payment_data = json.loads(base64.b64decode(payment_header).decode())
            
            # Verify resource URL
            if payment_data.get("resource") != resource_url:
                return False, {"error": "Resource URL mismatch"}
            
            # Verify amount
            expected_amount = int(expected_price_usd * 1_000_000)
            if int(payment_data.get("amount", 0)) < expected_amount:
                return False, {"error": "Insufficient payment amount"}
            
            # Verify validity
            if payment_data.get("validUntil", 0) < time.time():
                return False, {"error": "Payment expired"}
            
            # Verify signature
            signer = payment_data.get("signer")
            signature = bytes.fromhex(payment_data.get("signature", "").replace("0x", ""))
            
            # Recreate message without signature and signer
            verify_data = {k: v for k, v in payment_data.items() if k not in ["signature", "signer"]}
            message = json.dumps(verify_data, sort_keys=True)
            message_hash = encode_defunct(text=message)
            
            recovered = Account.recover_message(message_hash, signature=signature)
            
            if recovered.lower() != signer.lower():
                return False, {"error": "Invalid signature"}
            
            return True, payment_data
            
        except Exception as e:
            logger.error("payment_verification_error", error=str(e))
            return False, {"error": str(e)}
    
    async def settle_payment(
        self,
        payment_data: dict[str, Any],
        actual_amount_usd: Optional[float] = None,
    ) -> X402PaymentResponse:
        """
        Settle payment on-chain using Thirdweb facilitator.
        
        Args:
            payment_data: Verified payment data
            actual_amount_usd: Actual amount to charge (for pay-per-token)
            
        Returns:
            Settlement response
        """
        try:
            chain_id = payment_data.get("chainId")
            network = None
            for net_name, config in self.NETWORKS.items():
                if config["chain_id"] == chain_id:
                    network = net_name
                    break
            
            if not network:
                return X402PaymentResponse(
                    status=400,
                    settled=False,
                    error=f"Unsupported chain ID: {chain_id}"
                )
            
            # Calculate actual amount to charge
            if actual_amount_usd:
                amount_wei = int(actual_amount_usd * 1_000_000)
            else:
                amount_wei = int(payment_data.get("amount", 0))
            
            # Call Thirdweb facilitator API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.thirdweb.com/x402/settle",
                    headers={
                        "x-client-id": self.client_id,
                        "x-secret-key": self.secret_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "paymentData": payment_data,
                        "amount": str(amount_wei),
                        "facilitatorAddress": self.server_wallet,
                        "chainId": chain_id,
                    },
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return X402PaymentResponse(
                        status=200,
                        settled=True,
                        tx_hash=result.get("transactionHash"),
                        amount_paid_usd=amount_wei / 1_000_000,
                    )
                else:
                    return X402PaymentResponse(
                        status=response.status_code,
                        settled=False,
                        error=response.text,
                    )
                    
        except Exception as e:
            logger.error("payment_settlement_error", error=str(e))
            return X402PaymentResponse(
                status=500,
                settled=False,
                error=str(e),
            )
    
    def create_402_response(
        self,
        resource_url: str,
        price_usd: float,
        pay_to: str,
        network: str = "avalanche_fuji",
    ) -> dict[str, Any]:
        """
        Create HTTP 402 Payment Required response.
        
        Returns response body and headers for 402 status.
        """
        network_config = self.NETWORKS.get(network, self.NETWORKS["avalanche_fuji"])
        amount_wei = int(price_usd * 1_000_000)
        
        payment_requirements = {
            "accepts": [{
                "scheme": "x402",
                "network": network,
                "chainId": network_config["chain_id"],
                "asset": network_config["usdc"],
                "payTo": pay_to,
                "maxAmount": str(amount_wei),
                "resource": resource_url,
                "facilitator": self.server_wallet,
            }],
            "error": "Payment required",
            "price": f"${price_usd}",
        }
        
        headers = {
            "X-Payment-Required": "true",
            "X-Payment-Network": network,
            "X-Payment-Amount": str(amount_wei),
            "X-Payment-Asset": network_config["usdc"],
            "X-Payment-PayTo": pay_to,
        }
        
        return {
            "body": payment_requirements,
            "headers": headers,
        }


# Singleton instance
_x402_service: Optional[X402Service] = None


def get_x402_service() -> X402Service:
    """Get x402 service singleton."""
    global _x402_service
    if _x402_service is None:
        _x402_service = X402Service()
    return _x402_service
