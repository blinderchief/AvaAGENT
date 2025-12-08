/**
 * Turf Data Library
 * 
 * Integration with Turf Network for intelligent data orchestration.
 * Combines data querying with x402 payment in one call.
 * Based on: https://docs.turf.network/default-guide/overview
 */

import { env } from './env';
import { createPaymentFetch, X402_PRICING, formatUsdcPrice, type Wallet } from './thirdweb';

// ============================================================================
// Types
// ============================================================================

export type TurfDataType = 'price' | 'market' | 'on_chain' | 'sentiment' | 'defi';

export interface TurfQueryParams {
  dataType?: TurfDataType;
  asset?: string;
  timeframe?: '1h' | '4h' | '1d' | '7d' | '30d';
  source?: string;
  format?: 'json' | 'csv';
  limit?: number;
}

export interface TurfDataResponse {
  data: unknown;
  source: string;
  costUsd: number;
  latencyMs: number;
  attribution: {
    hash: string;
    provider: string;
    timestamp: string;
  };
  metadata: {
    query: string;
    dataType: TurfDataType;
    cached: boolean;
    confidence: number;
  };
}

export interface TurfPriceData {
  asset: string;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  timestamp: string;
}

export interface TurfSentimentData {
  asset: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to 1
  sources: {
    twitter: number;
    reddit: number;
    news: number;
  };
  trending: boolean;
  timestamp: string;
}

export interface TurfOnChainData {
  asset: string;
  activeAddresses: number;
  transactionCount: number;
  transferVolume: number;
  whaleActivity: 'high' | 'medium' | 'low';
  networkFees: number;
  timestamp: string;
}

export interface TurfDefiData {
  protocol: string;
  tvl: number;
  apy: number;
  volume24h: number;
  users24h: number;
  chain: string;
  timestamp: string;
}

// ============================================================================
// Data Type Descriptions
// ============================================================================

export const TURF_DATA_TYPES: Record<TurfDataType, { name: string; description: string; priceMultiplier: number }> = {
  price: {
    name: 'Price Data',
    description: 'Real-time and historical price data for crypto assets',
    priceMultiplier: 1,
  },
  market: {
    name: 'Market Data',
    description: 'Market cap, volume, and trading data',
    priceMultiplier: 1,
  },
  on_chain: {
    name: 'On-Chain Data',
    description: 'On-chain metrics, whale activity, and network analytics',
    priceMultiplier: 1.5,
  },
  sentiment: {
    name: 'Sentiment Data',
    description: 'Social sentiment analysis from Twitter, Reddit, and news',
    priceMultiplier: 2,
  },
  defi: {
    name: 'DeFi Data',
    description: 'DeFi protocol TVL, yields, and analytics',
    priceMultiplier: 1.5,
  },
};

// ============================================================================
// Turf Client
// ============================================================================

class TurfClient {
  private baseUrl: string;
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();
  private defaultCacheTtl: number = 60 * 1000; // 60 seconds

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_TURF_API_URL || 'https://api.turf.network') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generates a cache key for a query
   */
  private getCacheKey(query: string, params: TurfQueryParams): string {
    return `${query}:${JSON.stringify(params)}`;
  }

  /**
   * Gets data from cache if not expired
   */
  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Sets data in cache
   */
  private setCache(key: string, data: unknown, ttl: number = this.defaultCacheTtl): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Calculates the cost for a query
   */
  calculateQueryCost(dataType: TurfDataType = 'price'): { costWei: number; costUsd: string } {
    const baseCost = X402_PRICING.dataQueryPrice;
    const multiplier = TURF_DATA_TYPES[dataType].priceMultiplier;
    const costWei = Math.round(baseCost * multiplier);
    
    return {
      costWei,
      costUsd: formatUsdcPrice(costWei.toString()),
    };
  }

  /**
   * Fetches data from Turf Network without payment
   */
  async fetchData(
    query: string,
    params: TurfQueryParams = {},
    useCache: boolean = true
  ): Promise<TurfDataResponse> {
    const cacheKey = this.getCacheKey(query, params);
    
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          data: cached,
          source: 'cache',
          costUsd: 0,
          latencyMs: 0,
          attribution: {
            hash: '',
            provider: 'cache',
            timestamp: new Date().toISOString(),
          },
          metadata: {
            query,
            dataType: params.dataType || 'price',
            cached: true,
            confidence: 1,
          },
        };
      }
    }

    const startTime = Date.now();
    const { costWei } = this.calculateQueryCost(params.dataType);

    try {
      const response = await fetch(`${this.baseUrl}/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          data_type: params.dataType || 'price',
          asset: params.asset,
          timeframe: params.timeframe,
          source: params.source,
          format: params.format || 'json',
          limit: params.limit || 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Turf API error: ${response.status}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      // Cache the result
      if (useCache) {
        this.setCache(cacheKey, data.result);
      }

      return {
        data: data.result,
        source: data.source || 'turf',
        costUsd: Number(costWei) / 1_000_000,
        latencyMs,
        attribution: {
          hash: data.attribution_hash || '',
          provider: data.provider || 'turf',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          query,
          dataType: params.dataType || 'price',
          cached: false,
          confidence: data.confidence || 0.95,
        },
      };
    } catch (error) {
      console.error('Turf query failed:', error);
      throw error;
    }
  }

  /**
   * Fetches data from Turf Network with x402 payment
   */
  async fetchDataWithPayment(
    wallet: Wallet,
    query: string,
    params: TurfQueryParams = {}
  ): Promise<TurfDataResponse> {
    const { costWei } = this.calculateQueryCost(params.dataType);
    const paymentFetch = createPaymentFetch(wallet, BigInt(costWei));

    const startTime = Date.now();

    try {
      const response = await paymentFetch(`${this.baseUrl}/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          data_type: params.dataType || 'price',
          asset: params.asset,
          timeframe: params.timeframe,
          source: params.source,
          format: params.format || 'json',
          limit: params.limit || 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Turf API error: ${response.status}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        data: data.result,
        source: data.source || 'turf',
        costUsd: Number(costWei) / 1_000_000,
        latencyMs,
        attribution: {
          hash: data.attribution_hash || '',
          provider: data.provider || 'turf',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          query,
          dataType: params.dataType || 'price',
          cached: false,
          confidence: data.confidence || 0.95,
        },
      };
    } catch (error) {
      console.error('Turf query with payment failed:', error);
      throw error;
    }
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const turfClient = new TurfClient();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Query and pay in one call - the main Turf integration function
 */
export async function queryAndPay(
  wallet: Wallet,
  query: string,
  params: TurfQueryParams = {}
): Promise<TurfDataResponse> {
  return turfClient.fetchDataWithPayment(wallet, query, params);
}

/**
 * Fetches price data for an asset
 */
export async function getPriceData(
  asset: string,
  wallet?: Wallet
): Promise<TurfPriceData> {
  const query = `Get current price and 24h change for ${asset}`;
  const params: TurfQueryParams = { dataType: 'price', asset };

  const response = wallet
    ? await turfClient.fetchDataWithPayment(wallet, query, params)
    : await turfClient.fetchData(query, params);

  return response.data as TurfPriceData;
}

/**
 * Fetches sentiment data for an asset
 */
export async function getSentimentData(
  asset: string,
  wallet?: Wallet
): Promise<TurfSentimentData> {
  const query = `Get social sentiment analysis for ${asset}`;
  const params: TurfQueryParams = { dataType: 'sentiment', asset };

  const response = wallet
    ? await turfClient.fetchDataWithPayment(wallet, query, params)
    : await turfClient.fetchData(query, params);

  return response.data as TurfSentimentData;
}

/**
 * Fetches on-chain analytics for an asset
 */
export async function getOnChainData(
  asset: string,
  wallet?: Wallet
): Promise<TurfOnChainData> {
  const query = `Get on-chain analytics for ${asset}`;
  const params: TurfQueryParams = { dataType: 'on_chain', asset };

  const response = wallet
    ? await turfClient.fetchDataWithPayment(wallet, query, params)
    : await turfClient.fetchData(query, params);

  return response.data as TurfOnChainData;
}

/**
 * Fetches DeFi protocol data
 */
export async function getDefiData(
  protocol: string,
  wallet?: Wallet
): Promise<TurfDefiData> {
  const query = `Get DeFi analytics for ${protocol}`;
  const params: TurfQueryParams = { dataType: 'defi' };

  const response = wallet
    ? await turfClient.fetchDataWithPayment(wallet, query, params)
    : await turfClient.fetchData(query, params);

  return response.data as TurfDefiData;
}

/**
 * Natural language data query
 */
export async function naturalLanguageQuery(
  query: string,
  wallet?: Wallet
): Promise<TurfDataResponse> {
  // Detect data type from query
  let dataType: TurfDataType = 'price';
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('sentiment') || lowerQuery.includes('social') || lowerQuery.includes('twitter')) {
    dataType = 'sentiment';
  } else if (lowerQuery.includes('whale') || lowerQuery.includes('on-chain') || lowerQuery.includes('addresses')) {
    dataType = 'on_chain';
  } else if (lowerQuery.includes('tvl') || lowerQuery.includes('yield') || lowerQuery.includes('apy') || lowerQuery.includes('defi')) {
    dataType = 'defi';
  } else if (lowerQuery.includes('market cap') || lowerQuery.includes('volume')) {
    dataType = 'market';
  }

  const params: TurfQueryParams = { dataType };

  return wallet
    ? turfClient.fetchDataWithPayment(wallet, query, params)
    : turfClient.fetchData(query, params);
}

// ============================================================================
// Query Templates
// ============================================================================

export const QUERY_TEMPLATES = {
  price: (asset: string) => `Get current price for ${asset}`,
  priceHistory: (asset: string, timeframe: string) => `Get ${timeframe} price history for ${asset}`,
  sentiment: (asset: string) => `Get social sentiment analysis for ${asset} from Twitter, Reddit, and news`,
  whaleActivity: (asset: string) => `Get whale activity and large transfers for ${asset}`,
  defiYields: (protocol: string) => `Get current APY and TVL for ${protocol}`,
  marketOverview: () => 'Get overall crypto market overview including BTC dominance and total market cap',
  trendingAssets: () => 'Get top trending crypto assets by social volume',
  correlations: (asset: string) => `Get correlation analysis for ${asset} with major assets`,
};

// ============================================================================
// Export
// ============================================================================

export { TurfClient };
