"""
Blockchain Service

Multi-chain blockchain interactions for Avalanche and Kite networks.
"""

from typing import Any, Optional

from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3 import AsyncWeb3, Web3
from web3.exceptions import TransactionNotFound
from web3.middleware import ExtraDataToPOAMiddleware

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


class BlockchainService:
    """
    Multi-chain blockchain service.
    
    Supports Avalanche C-Chain, Fuji testnet, and Kite network.
    """
    
    # Network configurations
    NETWORKS = {
        "avalanche": {
            "chain_id": 43114,
            "rpc": "https://api.avax.network/ext/bc/C/rpc",
            "explorer": "https://snowtrace.io",
            "native_symbol": "AVAX",
            "usdc": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        },
        "avalanche_fuji": {
            "chain_id": 43113,
            "rpc": "https://api.avax-test.network/ext/bc/C/rpc",
            "explorer": "https://testnet.snowtrace.io",
            "native_symbol": "AVAX",
            "usdc": "0x5425890298aed601595a70AB815c96711a31Bc65",
        },
        "kite_testnet": {
            "chain_id": 2368,
            "rpc": "https://rpc-testnet.gokite.ai",
            "explorer": "https://testnet.kitescan.ai",
            "native_symbol": "KITE",
            "usdc": None,  # Native payments
        },
    }
    
    # Deployed Contract Addresses (Dec 2025)
    CONTRACT_ADDRESSES = {
        "avalanche_fuji": {
            "wallet_factory": "0x849Ca487D5DeD85c93fc3600338a419B100833a8",
            "agent_registry": "0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28",
            "payment_facilitator": "0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF",
            "intent_processor": "0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4",
        },
        "kite_testnet": {
            "wallet_factory": "0x849Ca487D5DeD85c93fc3600338a419B100833a8",
            "agent_registry": "0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28",
            "payment_facilitator": "0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF",
            "intent_processor": "0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4",
        },
    }
    
    # Contract ABIs
    WALLET_FACTORY_ABI = [
        {
            "inputs": [{"name": "owner", "type": "address"}, {"name": "dailySpendLimit", "type": "uint256"}],
            "name": "createWallet",
            "outputs": [{"name": "", "type": "address"}],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "inputs": [{"name": "owner", "type": "address"}],
            "name": "getWallet",
            "outputs": [{"name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function",
        },
        {
            "anonymous": False,
            "inputs": [
                {"indexed": True, "name": "wallet", "type": "address"},
                {"indexed": True, "name": "owner", "type": "address"},
            ],
            "name": "WalletCreated",
            "type": "event",
        },
    ]
    
    AGENT_REGISTRY_ABI = [
        {
            "inputs": [
                {"name": "agentId", "type": "bytes32"},
                {"name": "metadata", "type": "string"},
                {"name": "walletAddress", "type": "address"},
            ],
            "name": "registerAgent",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "inputs": [{"name": "agentId", "type": "bytes32"}],
            "name": "getAgent",
            "outputs": [
                {"name": "owner", "type": "address"},
                {"name": "walletAddress", "type": "address"},
                {"name": "metadata", "type": "string"},
                {"name": "reputation", "type": "uint256"},
                {"name": "isActive", "type": "bool"},
            ],
            "stateMutability": "view",
            "type": "function",
        },
        {
            "inputs": [{"name": "owner", "type": "address"}],
            "name": "getAgentsByOwner",
            "outputs": [{"name": "", "type": "bytes32[]"}],
            "stateMutability": "view",
            "type": "function",
        },
    ]
    
    PAYMENT_FACILITATOR_ABI = [
        {
            "inputs": [
                {"name": "recipient", "type": "address"},
                {"name": "token", "type": "address"},
                {"name": "amount", "type": "uint256"},
                {"name": "resourceId", "type": "bytes32"},
            ],
            "name": "facilitatePayment",
            "outputs": [{"name": "", "type": "bytes32"}],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "inputs": [{"name": "paymentId", "type": "bytes32"}],
            "name": "getPayment",
            "outputs": [
                {"name": "payer", "type": "address"},
                {"name": "recipient", "type": "address"},
                {"name": "amount", "type": "uint256"},
                {"name": "settled", "type": "bool"},
            ],
            "stateMutability": "view",
            "type": "function",
        },
    ]
    
    INTENT_PROCESSOR_ABI = [
        {
            "inputs": [
                {"name": "intentType", "type": "uint8"},
                {"name": "data", "type": "bytes"},
                {"name": "value", "type": "uint256"},
            ],
            "name": "submitIntent",
            "outputs": [{"name": "", "type": "bytes32"}],
            "stateMutability": "payable",
            "type": "function",
        },
        {
            "inputs": [{"name": "intentId", "type": "bytes32"}],
            "name": "getIntent",
            "outputs": [
                {"name": "submitter", "type": "address"},
                {"name": "intentType", "type": "uint8"},
                {"name": "status", "type": "uint8"},
                {"name": "result", "type": "bytes"},
            ],
            "stateMutability": "view",
            "type": "function",
        },
    ]
    
    # ERC-20 ABI (minimal for balance and transfer)
    ERC20_ABI = [
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function",
        },
        {
            "constant": True,
            "inputs": [],
            "name": "decimals",
            "outputs": [{"name": "", "type": "uint8"}],
            "type": "function",
        },
        {
            "constant": False,
            "inputs": [
                {"name": "_to", "type": "address"},
                {"name": "_value", "type": "uint256"},
            ],
            "name": "transfer",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function",
        },
        {
            "constant": False,
            "inputs": [
                {"name": "_spender", "type": "address"},
                {"name": "_value", "type": "uint256"},
            ],
            "name": "approve",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function",
        },
        {
            "constant": True,
            "inputs": [
                {"name": "_owner", "type": "address"},
                {"name": "_spender", "type": "address"},
            ],
            "name": "allowance",
            "outputs": [{"name": "", "type": "uint256"}],
            "type": "function",
        },
    ]
    
    def __init__(self):
        self._web3_instances: dict[str, Web3] = {}
        self._async_web3_instances: dict[str, AsyncWeb3] = {}
    
    def get_web3(self, network: str = "avalanche_fuji") -> Web3:
        """Get Web3 instance for a network."""
        if network not in self._web3_instances:
            config = self.NETWORKS.get(network)
            if not config:
                raise ValueError(f"Unsupported network: {network}")
            
            w3 = Web3(Web3.HTTPProvider(config["rpc"]))
            # Add POA middleware for Avalanche/Kite
            w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
            self._web3_instances[network] = w3
        
        return self._web3_instances[network]
    
    async def get_async_web3(self, network: str = "avalanche_fuji") -> AsyncWeb3:
        """Get async Web3 instance for a network."""
        if network not in self._async_web3_instances:
            config = self.NETWORKS.get(network)
            if not config:
                raise ValueError(f"Unsupported network: {network}")
            
            w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(config["rpc"]))
            self._async_web3_instances[network] = w3
        
        return self._async_web3_instances[network]
    
    async def get_balance(
        self,
        address: str,
        network: str = "avalanche_fuji",
        token_address: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Get balance for an address.
        
        Args:
            address: Wallet address
            network: Network to check
            token_address: Optional ERC-20 token address
            
        Returns:
            Balance information
        """
        w3 = self.get_web3(network)
        config = self.NETWORKS[network]
        
        result = {
            "network": network,
            "address": address,
        }
        
        # Get native balance
        native_balance = w3.eth.get_balance(w3.to_checksum_address(address))
        result["native"] = {
            "symbol": config["native_symbol"],
            "balance_wei": str(native_balance),
            "balance": str(w3.from_wei(native_balance, "ether")),
        }
        
        # Get token balance if requested
        if token_address:
            try:
                token = w3.eth.contract(
                    address=w3.to_checksum_address(token_address),
                    abi=self.ERC20_ABI,
                )
                token_balance = token.functions.balanceOf(
                    w3.to_checksum_address(address)
                ).call()
                decimals = token.functions.decimals().call()
                
                result["token"] = {
                    "address": token_address,
                    "balance_wei": str(token_balance),
                    "balance": str(token_balance / (10 ** decimals)),
                    "decimals": decimals,
                }
            except Exception as e:
                logger.error("token_balance_error", error=str(e))
                result["token"] = {"error": str(e)}
        
        # Get USDC balance by default if available
        if config.get("usdc") and not token_address:
            try:
                usdc = w3.eth.contract(
                    address=w3.to_checksum_address(config["usdc"]),
                    abi=self.ERC20_ABI,
                )
                usdc_balance = usdc.functions.balanceOf(
                    w3.to_checksum_address(address)
                ).call()
                
                result["usdc"] = {
                    "address": config["usdc"],
                    "balance_wei": str(usdc_balance),
                    "balance": str(usdc_balance / 1_000_000),  # USDC has 6 decimals
                }
            except Exception as e:
                logger.warning("usdc_balance_error", error=str(e))
        
        return result
    
    async def get_transaction(
        self,
        tx_hash: str,
        network: str = "avalanche_fuji",
    ) -> Optional[dict[str, Any]]:
        """
        Get transaction details by hash.
        
        Args:
            tx_hash: Transaction hash
            network: Network to check
            
        Returns:
            Transaction details or None
        """
        w3 = self.get_web3(network)
        config = self.NETWORKS[network]
        
        try:
            tx = w3.eth.get_transaction(tx_hash)
            receipt = w3.eth.get_transaction_receipt(tx_hash)
            
            return {
                "hash": tx_hash,
                "network": network,
                "from": tx["from"],
                "to": tx.get("to"),
                "value_wei": str(tx["value"]),
                "value": str(w3.from_wei(tx["value"], "ether")),
                "gas_used": receipt["gasUsed"],
                "gas_price_wei": str(tx["gasPrice"]),
                "block_number": receipt["blockNumber"],
                "status": "success" if receipt["status"] == 1 else "failed",
                "explorer_url": f"{config['explorer']}/tx/{tx_hash}",
            }
        except TransactionNotFound:
            return None
        except Exception as e:
            logger.error("get_transaction_error", error=str(e))
            return None
    
    async def estimate_gas(
        self,
        from_address: str,
        to_address: str,
        value_wei: int = 0,
        data: str = "0x",
        network: str = "avalanche_fuji",
    ) -> dict[str, Any]:
        """
        Estimate gas for a transaction.
        
        Args:
            from_address: Sender address
            to_address: Recipient address
            value_wei: Value in wei
            data: Transaction data
            network: Network to use
            
        Returns:
            Gas estimation
        """
        w3 = self.get_web3(network)
        
        try:
            gas_estimate = w3.eth.estimate_gas({
                "from": w3.to_checksum_address(from_address),
                "to": w3.to_checksum_address(to_address),
                "value": value_wei,
                "data": data,
            })
            
            gas_price = w3.eth.gas_price
            
            return {
                "gas_limit": gas_estimate,
                "gas_price_wei": str(gas_price),
                "estimated_cost_wei": str(gas_estimate * gas_price),
                "estimated_cost": str(w3.from_wei(gas_estimate * gas_price, "ether")),
            }
        except Exception as e:
            logger.error("gas_estimation_error", error=str(e))
            return {"error": str(e)}
    
    async def send_transaction(
        self,
        private_key: str,
        to_address: str,
        value_wei: int = 0,
        data: str = "0x",
        network: str = "avalanche_fuji",
        gas_limit: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Send a transaction.
        
        Args:
            private_key: Sender's private key
            to_address: Recipient address
            value_wei: Value in wei
            data: Transaction data
            network: Network to use
            gas_limit: Optional gas limit
            
        Returns:
            Transaction result
        """
        w3 = self.get_web3(network)
        config = self.NETWORKS[network]
        
        try:
            account: LocalAccount = Account.from_key(private_key)
            
            # Build transaction
            tx = {
                "from": account.address,
                "to": w3.to_checksum_address(to_address),
                "value": value_wei,
                "data": data,
                "nonce": w3.eth.get_transaction_count(account.address),
                "gasPrice": w3.eth.gas_price,
                "chainId": config["chain_id"],
            }
            
            # Estimate or use provided gas limit
            if gas_limit:
                tx["gas"] = gas_limit
            else:
                tx["gas"] = w3.eth.estimate_gas(tx)
            
            # Sign and send
            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            
            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "explorer_url": f"{config['explorer']}/tx/{tx_hash.hex()}",
            }
            
        except Exception as e:
            logger.error("send_transaction_error", error=str(e))
            return {
                "success": False,
                "error": str(e),
            }
    
    def create_wallet(self) -> dict[str, str]:
        """Create a new wallet."""
        account = Account.create()
        return {
            "address": account.address,
            "private_key": account.key.hex(),
        }
    
    def get_network_info(self, network: str) -> dict[str, Any]:
        """Get network configuration."""
        config = self.NETWORKS.get(network)
        if not config:
            raise ValueError(f"Unsupported network: {network}")
        return config
    
    def get_contract_addresses(self, network: str = "avalanche_fuji") -> dict[str, str]:
        """Get deployed contract addresses for a network."""
        addresses = self.CONTRACT_ADDRESSES.get(network)
        if not addresses:
            raise ValueError(f"No contracts deployed on network: {network}")
        return addresses
    
    def get_wallet_factory_contract(self, network: str = "avalanche_fuji"):
        """Get WalletFactory contract instance."""
        w3 = self.get_web3(network)
        addresses = self.get_contract_addresses(network)
        return w3.eth.contract(
            address=w3.to_checksum_address(addresses["wallet_factory"]),
            abi=self.WALLET_FACTORY_ABI,
        )
    
    def get_agent_registry_contract(self, network: str = "avalanche_fuji"):
        """Get AgentRegistry contract instance."""
        w3 = self.get_web3(network)
        addresses = self.get_contract_addresses(network)
        return w3.eth.contract(
            address=w3.to_checksum_address(addresses["agent_registry"]),
            abi=self.AGENT_REGISTRY_ABI,
        )
    
    def get_payment_facilitator_contract(self, network: str = "avalanche_fuji"):
        """Get PaymentFacilitator contract instance."""
        w3 = self.get_web3(network)
        addresses = self.get_contract_addresses(network)
        return w3.eth.contract(
            address=w3.to_checksum_address(addresses["payment_facilitator"]),
            abi=self.PAYMENT_FACILITATOR_ABI,
        )
    
    def get_intent_processor_contract(self, network: str = "avalanche_fuji"):
        """Get IntentProcessor contract instance."""
        w3 = self.get_web3(network)
        addresses = self.get_contract_addresses(network)
        return w3.eth.contract(
            address=w3.to_checksum_address(addresses["intent_processor"]),
            abi=self.INTENT_PROCESSOR_ABI,
        )
    
    async def get_agent_wallet(
        self, 
        owner_address: str, 
        network: str = "avalanche_fuji"
    ) -> Optional[str]:
        """Get the wallet address for an owner from the WalletFactory."""
        try:
            contract = self.get_wallet_factory_contract(network)
            w3 = self.get_web3(network)
            wallet_address = contract.functions.getWallet(
                w3.to_checksum_address(owner_address)
            ).call()
            
            # Check if wallet exists (not zero address)
            if wallet_address == "0x0000000000000000000000000000000000000000":
                return None
            return wallet_address
        except Exception as e:
            logger.error("get_agent_wallet_error", owner=owner_address, error=str(e))
            return None
    
    async def get_registered_agent(
        self, 
        agent_id: bytes, 
        network: str = "avalanche_fuji"
    ) -> Optional[dict[str, Any]]:
        """Get agent information from the AgentRegistry."""
        try:
            contract = self.get_agent_registry_contract(network)
            result = contract.functions.getAgent(agent_id).call()
            
            return {
                "owner": result[0],
                "wallet_address": result[1],
                "metadata": result[2],
                "reputation": result[3],
                "is_active": result[4],
            }
        except Exception as e:
            logger.error("get_registered_agent_error", error=str(e))
            return None
    
    async def get_agents_by_owner(
        self, 
        owner_address: str, 
        network: str = "avalanche_fuji"
    ) -> list[bytes]:
        """Get all agent IDs owned by an address."""
        try:
            contract = self.get_agent_registry_contract(network)
            w3 = self.get_web3(network)
            agent_ids = contract.functions.getAgentsByOwner(
                w3.to_checksum_address(owner_address)
            ).call()
            return agent_ids
        except Exception as e:
            logger.error("get_agents_by_owner_error", error=str(e))
            return []


# Singleton instance
_blockchain_service: Optional[BlockchainService] = None


def get_blockchain_service() -> BlockchainService:
    """Get blockchain service singleton."""
    global _blockchain_service
    if _blockchain_service is None:
        _blockchain_service = BlockchainService()
    return _blockchain_service
