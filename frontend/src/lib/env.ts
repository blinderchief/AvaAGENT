/**
 * Environment validation and type-safe access
 * Validates all required environment variables at build/runtime
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_API_URL',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_AVALANCHE_RPC_URL',
  'NEXT_PUBLIC_KITE_RPC_URL',
  'NEXT_PUBLIC_ENABLE_ANALYTICS',
  'NEXT_PUBLIC_ENVIRONMENT',
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];
type OptionalEnvVar = (typeof optionalEnvVars)[number];

interface EnvConfig {
  // Required
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  API_URL: string;
  
  // Optional with defaults
  AVALANCHE_RPC_URL: string;
  KITE_RPC_URL: string;
  ENABLE_ANALYTICS: boolean;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  
  // Derived
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function validateEnv(): void {
  const missing: string[] = [];
  
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    // In development, just warn
    if (process.env.NODE_ENV !== 'development') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Validate on import (server-side only)
if (typeof window === 'undefined') {
  validateEnv();
}

export const env: EnvConfig = {
  // Required
  CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Optional with defaults
  AVALANCHE_RPC_URL: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  KITE_RPC_URL: process.env.NEXT_PUBLIC_KITE_RPC_URL || 'https://rpc-testnet.gokite.ai/',
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENVIRONMENT: (process.env.NEXT_PUBLIC_ENVIRONMENT as EnvConfig['ENVIRONMENT']) || 'development',
  
  // Derived
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

// Network configurations
export const networks = {
  avalanche_fuji: {
    chainId: 43113,
    name: 'Avalanche Fuji Testnet',
    rpcUrl: env.AVALANCHE_RPC_URL,
    explorerUrl: 'https://testnet.snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
  kite_testnet: {
    chainId: 2368,
    name: 'KiteAI Testnet',
    rpcUrl: env.KITE_RPC_URL,
    explorerUrl: 'https://testnet.kitescan.ai',
    nativeCurrency: {
      name: 'KITE',
      symbol: 'KITE',
      decimals: 18,
    },
  },
} as const;

export type NetworkKey = keyof typeof networks;

// Contract addresses (deployed to Avalanche Fuji and KiteAI Testnet - Dec 2025)
export const contracts = {
  avalanche_fuji: {
    walletFactory: process.env.NEXT_PUBLIC_WALLET_FACTORY_ADDRESS || '0x849Ca487D5DeD85c93fc3600338a419B100833a8',
    agentRegistry: process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28',
    paymentFacilitator: process.env.NEXT_PUBLIC_PAYMENT_FACILITATOR_ADDRESS || '0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF',
    intentProcessor: process.env.NEXT_PUBLIC_INTENT_PROCESSOR_ADDRESS || '0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4',
  },
  kite_testnet: {
    walletFactory: '0x849Ca487D5DeD85c93fc3600338a419B100833a8',
    agentRegistry: '0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28',
    paymentFacilitator: '0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF',
    intentProcessor: '0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4',
  },
} as const;

// Contract ABIs (minimal for frontend interactions)
export const CONTRACT_ABIS = {
  walletFactory: [
    {
      inputs: [{ name: 'owner', type: 'address' }, { name: 'dailySpendLimit', type: 'uint256' }],
      name: 'createWallet',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'owner', type: 'address' }],
      name: 'getWallet',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  agentRegistry: [
    {
      inputs: [
        { name: 'agentId', type: 'bytes32' },
        { name: 'metadata', type: 'string' },
        { name: 'walletAddress', type: 'address' },
      ],
      name: 'registerAgent',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'agentId', type: 'bytes32' }],
      name: 'getAgent',
      outputs: [
        { name: 'owner', type: 'address' },
        { name: 'walletAddress', type: 'address' },
        { name: 'metadata', type: 'string' },
        { name: 'reputation', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'owner', type: 'address' }],
      name: 'getAgentsByOwner',
      outputs: [{ name: '', type: 'bytes32[]' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  paymentFacilitator: [
    {
      inputs: [
        { name: 'recipient', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'resourceId', type: 'bytes32' },
      ],
      name: 'facilitatePayment',
      outputs: [{ name: '', type: 'bytes32' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'paymentId', type: 'bytes32' }],
      name: 'getPayment',
      outputs: [
        { name: 'payer', type: 'address' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'settled', type: 'bool' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  intentProcessor: [
    {
      inputs: [
        { name: 'intentType', type: 'uint8' },
        { name: 'data', type: 'bytes' },
        { name: 'value', type: 'uint256' },
      ],
      name: 'submitIntent',
      outputs: [{ name: '', type: 'bytes32' }],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [{ name: 'intentId', type: 'bytes32' }],
      name: 'getIntent',
      outputs: [
        { name: 'submitter', type: 'address' },
        { name: 'intentType', type: 'uint8' },
        { name: 'status', type: 'uint8' },
        { name: 'result', type: 'bytes' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
} as const;
