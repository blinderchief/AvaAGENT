/**
 * Thirdweb Integration
 * 
 * Wallet connect, ERC-4337 Account Abstraction SDK, and x402 payment integration.
 * Based on: https://portal.thirdweb.com/ and https://github.com/federiconardelli7/x402-starter-kit
 */

import { createThirdwebClient } from 'thirdweb';
import { createWallet, inAppWallet, type Wallet } from 'thirdweb/wallets';
import { avalancheFuji } from 'thirdweb/chains';
import { wrapFetchWithPayment, settlePayment, facilitator, verifyPayment, type PaymentArgs } from 'thirdweb/x402';
import { env, networks } from './env';

// ============================================================================
// Thirdweb Client Configuration
// ============================================================================

/**
 * Client-side Thirdweb client (uses client ID)
 */
export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

/**
 * Server-side Thirdweb client (uses secret key)
 */
export const createServerClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Server client should not be used on client side');
  }
  return createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY!,
  });
};

// ============================================================================
// Chain Configuration
// ============================================================================

/**
 * Custom chain definition for Kite Testnet
 */
export const kiteTestnet = {
  id: networks.kite_testnet.chainId,
  name: 'Kite Testnet',
  rpc: networks.kite_testnet.rpcUrl,
  nativeCurrency: {
    name: 'KITE',
    symbol: 'KITE',
    decimals: 18,
  },
  testnet: true,
};

/**
 * Supported chains for AvaAgent
 */
export const supportedChains = [avalancheFuji, kiteTestnet];

/**
 * Default chain for transactions
 */
export const defaultChain = avalancheFuji;

// ============================================================================
// Token Configuration
// ============================================================================

/**
 * USDC token addresses by network
 */
export const USDC_ADDRESSES = {
  avalancheFuji: '0x5425890298aed601595a70AB815c96711a31Bc65' as `0x${string}`,
  avalancheMainnet: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as `0x${string}`,
} as const;

/**
 * AVAX token (native) - represented as zero address
 */
export const AVAX_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// ============================================================================
// Wallet Configuration
// ============================================================================

/**
 * Supported wallet types for AvaAgent
 */
export const supportedWallets: Wallet[] = [
  // Social/email login with account abstraction
  inAppWallet({
    auth: {
      options: ['google', 'email', 'passkey', 'apple'],
    },
  }),
  // External wallets
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
];

/**
 * Wallet connection configuration
 */
export const walletConfig = {
  client: thirdwebClient,
  wallets: supportedWallets,
  chain: defaultChain,
  connectButton: {
    label: 'Connect Wallet',
  },
  supportedTokens: {
    [avalancheFuji.id]: [
      {
        address: USDC_ADDRESSES.avalancheFuji,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
    ],
  },
};

// ============================================================================
// x402 Payment Protocol
// ============================================================================

/**
 * Payment tier configuration
 */
export const PAYMENT_TIERS = {
  basic: {
    name: 'Basic',
    priceUsd: 0.01,
    amount: '10000', // $0.01 USDC (6 decimals)
    bigInt: BigInt(10000),
    description: 'Standard access tier',
  },
  premium: {
    name: 'Premium',
    priceUsd: 0.15,
    amount: '150000', // $0.15 USDC (6 decimals)
    bigInt: BigInt(150000),
    description: 'Full access to all features',
  },
  enterprise: {
    name: 'Enterprise',
    priceUsd: 1.0,
    amount: '1000000', // $1.00 USDC (6 decimals)
    bigInt: BigInt(1000000),
    description: 'Enterprise-grade access',
  },
} as const;

/**
 * x402 pricing configuration for AI inference
 */
export const X402_PRICING = {
  pricePerTokenWei: 1, // 0.000001 USDC per token
  maxTokensPerCall: 1000000, // 1M tokens max
  dataQueryPrice: 5000, // $0.005 USDC for data queries (Turf)
  purchaseFee: 10000, // $0.01 per purchase (Reap)
} as const;

/**
 * Normalizes ECDSA signature v value to legacy format (27/28)
 * Required for Avalanche compatibility
 */
export function normalizeSignatureV(signature: string, chainId: number): string {
  const vHex = signature.slice(130);
  const vValue = parseInt(vHex, 16);

  let normalizedV: number;

  if (vValue === 0 || vValue === 1) {
    // Already in yParity format, convert to legacy
    normalizedV = vValue + 27;
  } else if (vValue === 27 || vValue === 28) {
    // Already in legacy format
    normalizedV = vValue;
  } else if (vValue >= 35) {
    // EIP-155 format: v = chainId * 2 + 35 + yParity
    const yParity = (vValue - 35 - chainId * 2) % 2;
    normalizedV = yParity + 27;
  } else {
    console.warn('Unexpected v value:', vValue, '- attempting fallback');
    normalizedV = vValue;
  }

  const normalizedSignature = signature.slice(0, 130) + normalizedV.toString(16).padStart(2, '0');
  return normalizedSignature;
}

/**
 * Creates a fetch wrapper that normalizes payment signatures for Avalanche
 */
export function createNormalizedFetch(chainId: number): typeof fetch {
  return async (input, init) => {
    let paymentHeader: string | null = null;

    if (init?.headers instanceof Headers) {
      paymentHeader = init.headers.get('x-payment') || init.headers.get('X-PAYMENT');
    } else if (typeof init?.headers === 'object' && init.headers !== null) {
      const headers = init.headers as Record<string, string>;
      paymentHeader = headers['x-payment'] || headers['X-PAYMENT'];
    }

    if (paymentHeader) {
      try {
        const decoded = JSON.parse(atob(paymentHeader));

        if (decoded.payload?.signature) {
          const originalSig = decoded.payload.signature;
          const normalizedSig = normalizeSignatureV(originalSig, chainId);
          decoded.payload.signature = normalizedSig;
          const normalizedPaymentHeader = btoa(JSON.stringify(decoded));

          if (init?.headers instanceof Headers) {
            init.headers.set('X-PAYMENT', normalizedPaymentHeader);
          } else if (typeof init?.headers === 'object' && init.headers !== null) {
            const headers = init.headers as Record<string, string>;
            delete headers['x-payment'];
            delete headers['X-PAYMENT'];
            headers['X-PAYMENT'] = normalizedPaymentHeader;
          }
        }
      } catch (e) {
        console.error('Failed to normalize payment:', e);
      }
    }

    return fetch(input, init);
  };
}

/**
 * Creates an x402-enabled fetch wrapper for making paid requests
 */
export function createPaymentFetch(wallet: Wallet, maxAmount?: bigint) {
  const normalizedFetch = createNormalizedFetch(avalancheFuji.id);
  return wrapFetchWithPayment(
    normalizedFetch,
    thirdwebClient,
    wallet,
    { maxValue: maxAmount || PAYMENT_TIERS.premium.bigInt }
  );
}

// ============================================================================
// ERC-4337 Account Abstraction
// ============================================================================

/**
 * Configuration for ERC-4337 smart accounts
 */
export const smartAccountConfig = {
  chain: defaultChain,
  sponsorGas: true, // Enable gas sponsorship
};

/**
 * Creates an ERC-4337 smart account for an agent
 */
export async function createSmartAccount(ownerWallet: Wallet) {
  // In production, this would deploy an ERC-4337 smart account
  // using Thirdweb's Account Factory
  const account = await ownerWallet.getAccount();
  
  return {
    address: account?.address,
    isDeployed: false, // Counterfactual until first transaction
    chain: defaultChain,
    type: 'ERC4337' as const,
  };
}

// ============================================================================
// Server-side Payment Facilitation
// ============================================================================

/**
 * Creates a payment facilitator for server-side settlement
 */
export function createFacilitator(secretKey: string, serverWalletAddress: string) {
  const client = createThirdwebClient({ secretKey });
  return facilitator({
    client,
    serverWalletAddress,
  });
}

/**
 * Verifies an x402 payment before processing
 */
export async function verifyX402Payment(
  request: Request,
  resourceUrl: string,
  priceAmount: string,
  facilitatorInstance: ReturnType<typeof facilitator>
): Promise<{ valid: boolean; error?: string; result?: Awaited<ReturnType<typeof verifyPayment>> }> {
  const paymentData = request.headers.get('x-payment');

  if (!paymentData) {
    return { valid: false, error: 'Missing x-payment header' };
  }

  const paymentArgs: PaymentArgs = {
    facilitator: facilitatorInstance,
    method: request.method as 'GET' | 'POST',
    network: avalancheFuji,
    scheme: 'exact',
    price: {
      amount: priceAmount,
      asset: { address: USDC_ADDRESSES.avalancheFuji },
    },
    resourceUrl,
    paymentData,
  };

  const result = await verifyPayment(paymentArgs);

  if (result.status !== 200) {
    return { 
      valid: false, 
      error: 'Payment verification failed',
      result,
    };
  }

  return { valid: true, result };
}

/**
 * Settles an x402 payment after service delivery
 */
export async function settleX402Payment(
  paymentArgs: PaymentArgs,
  actualAmount?: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    let args: PaymentArgs = paymentArgs;
    
    if (actualAmount && typeof paymentArgs.price === 'object' && 'amount' in paymentArgs.price) {
      args = {
        ...paymentArgs,
        price: {
          ...paymentArgs.price,
          amount: actualAmount,
        },
      };
    }

    const result = await settlePayment(args);

    if (result.status === 200) {
      return { success: true };
    }

    return { 
      success: false, 
      error: `Settlement failed with status ${result.status}`,
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a price in USDC (6 decimals) to a human-readable string
 */
export function formatUsdcPrice(amountWei: string | bigint): string {
  const amount = typeof amountWei === 'string' ? BigInt(amountWei) : amountWei;
  const dollars = Number(amount) / 1_000_000;
  return `$${dollars.toFixed(6)}`;
}

/**
 * Converts USD to USDC wei (6 decimals)
 */
export function usdToUsdc(usd: number): bigint {
  return BigInt(Math.round(usd * 1_000_000));
}

/**
 * Gets the explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string, chainId: number = avalancheFuji.id): string {
  const explorers: Record<number, string> = {
    [avalancheFuji.id]: 'https://testnet.snowtrace.io/tx/',
    43114: 'https://snowtrace.io/tx/',
    [networks.kite_testnet.chainId]: 'https://testnet.kitescan.ai/tx/',
  };

  return `${explorers[chainId] || explorers[avalancheFuji.id]}${txHash}`;
}

/**
 * Shortens an address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Wallet,
  PaymentArgs,
};

export {
  wrapFetchWithPayment,
  settlePayment,
  verifyPayment,
  facilitator,
  avalancheFuji,
};
