"""
AvaAgent Configuration Management

Centralized settings using Pydantic v2 for type-safe configuration.
"""

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ==========================================================================
    # Server Configuration
    # ==========================================================================
    app_env: str = Field(default="development", description="Application environment")
    app_debug: bool = Field(default=False, description="Debug mode")
    app_host: str = Field(default="0.0.0.0", description="Server host")
    app_port: int = Field(default=8000, description="Server port")
    app_workers: int = Field(default=4, description="Number of workers")

    # ==========================================================================
    # Database Configuration (Neon PostgreSQL)
    # ==========================================================================
    database_url: PostgresDsn = Field(
        ..., description="Neon PostgreSQL connection URL"
    )
    database_pool_size: int = Field(default=20, description="Connection pool size")
    database_max_overflow: int = Field(default=10, description="Max overflow connections")

    # ==========================================================================
    # Redis Configuration
    # ==========================================================================
    redis_url: RedisDsn = Field(
        default="redis://localhost:6379/0", description="Redis connection URL"
    )

    # ==========================================================================
    # Clerk Authentication
    # ==========================================================================
    clerk_secret_key: str = Field(..., description="Clerk secret key")
    clerk_publishable_key: str = Field(..., description="Clerk publishable key")
    clerk_webhook_secret: Optional[str] = Field(None, description="Clerk webhook secret")
    clerk_jwt_issuer: str = Field(..., description="Clerk JWT issuer URL")

    # ==========================================================================
    # AI Configuration (Gemini)
    # ==========================================================================
    google_api_key: str = Field(..., description="Google/Gemini API key")
    gemini_model: str = Field(default="gemini-1.5-pro", description="Primary Gemini model")
    gemini_flash_model: str = Field(
        default="gemini-1.5-flash", description="Fast Gemini model"
    )
    ai_max_tokens: int = Field(default=8192, description="Max tokens per request")
    ai_temperature: float = Field(default=0.7, description="AI temperature")

    # ==========================================================================
    # Avalanche Configuration
    # ==========================================================================
    avalanche_c_chain_rpc: str = Field(
        default="https://api.avax.network/ext/bc/C/rpc",
        description="Avalanche C-Chain RPC"
    )
    avalanche_fuji_rpc: str = Field(
        default="https://api.avax-test.network/ext/bc/C/rpc",
        description="Avalanche Fuji Testnet RPC"
    )
    avalanche_data_api_key: Optional[str] = Field(
        None, description="Avalanche Data API key"
    )

    # ==========================================================================
    # Kite Network Configuration
    # ==========================================================================
    kite_rpc_url: str = Field(
        default="https://rpc-testnet.gokite.ai",
        description="Kite Network RPC URL"
    )
    kite_chain_id: int = Field(default=2368, description="Kite Chain ID")
    kite_explorer_url: str = Field(
        default="https://testnet.kitescan.ai",
        description="Kite Explorer URL"
    )

    # ==========================================================================
    # Thirdweb x402 Configuration
    # ==========================================================================
    thirdweb_client_id: str = Field(..., description="Thirdweb client ID")
    thirdweb_secret_key: str = Field(..., description="Thirdweb secret key")
    thirdweb_server_wallet_address: str = Field(
        ..., description="Thirdweb server wallet (ERC-4337)"
    )
    x402_facilitator_address: Optional[str] = Field(
        None, description="x402 facilitator address"
    )
    x402_price_per_token_wei: int = Field(
        default=1, description="Price per token in wei"
    )

    # ==========================================================================
    # Reap Protocol Configuration
    # ==========================================================================
    reap_api_url: str = Field(
        default="https://avax2.api.reap.deals",
        description="Reap Protocol API URL"
    )
    reap_contract_address: str = Field(
        default="0x93498CAda15768E301AB8C6fc3Bc17402Ad078AA",
        description="Reap contract address"
    )
    reap_holocron_router: str = Field(
        default="0x2cEC5Bf3a0D3fEe4E13e8f2267176BdD579F4fd8",
        description="Reap Holocron Router address"
    )

    # ==========================================================================
    # Turf Network Configuration
    # ==========================================================================
    turf_api_url: str = Field(
        default="https://api.turf.network",
        description="Turf Network API URL"
    )
    turf_api_key: Optional[str] = Field(None, description="Turf API key")

    # ==========================================================================
    # Kite AI Configuration
    # ==========================================================================
    kite_ai_api_url: str = Field(
        default="https://api.gokite.ai",
        description="Kite AI API URL"
    )
    kite_ai_api_key: Optional[str] = Field(None, description="Kite AI API key")

    # ==========================================================================
    # YouMio Configuration
    # ==========================================================================
    youmio_api_url: str = Field(
        default="https://api.youmio.ai",
        description="YouMio API URL"
    )
    youmio_api_key: Optional[str] = Field(None, description="YouMio API key")

    # ==========================================================================
    # Security Configuration
    # ==========================================================================
    secret_key: str = Field(..., description="Application secret key")
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins"
    )
    allowed_hosts: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        description="Allowed hosts"
    )

    # ==========================================================================
    # Agent Wallet Configuration
    # ==========================================================================
    agent_wallet_factory_address: Optional[str] = Field(
        None, description="Agent wallet factory contract"
    )
    default_daily_spend_limit: int = Field(
        default=500, description="Default daily spend limit (USD)"
    )
    default_transaction_limit: int = Field(
        default=100, description="Default per-transaction limit (USD)"
    )
    guardian_module_address: Optional[str] = Field(
        None, description="Guardian module address"
    )

    # ==========================================================================
    # Monitoring & Logging
    # ==========================================================================
    log_level: str = Field(default="INFO", description="Logging level")
    sentry_dsn: Optional[str] = Field(None, description="Sentry DSN")
    enable_metrics: bool = Field(default=True, description="Enable metrics")

    @field_validator("cors_origins", "allowed_hosts", mode="before")
    @classmethod
    def parse_list(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [item.strip() for item in v.split(",")]
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
