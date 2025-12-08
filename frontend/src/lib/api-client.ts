/**
 * Enhanced API Client with retry logic, caching, and error handling
 */

import { env } from './env';

// Types
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
}

// Constants
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Custom error class
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  static fromResponse(response: Response, body?: unknown): ApiClientError {
    const message = (body as ApiError)?.message || `HTTP ${response.status}`;
    const code = (body as ApiError)?.code;
    const details = (body as ApiError)?.details;
    return new ApiClientError(message, response.status, code, details);
  }
}

// Utility functions
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(2, attempt),
    config.maxDelay
  );
  // Add jitter
  return delay + Math.random() * 1000;
}

function isRetryableError(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

// Main API client class
class EnhancedApiClient {
  private baseUrl: string;
  private tokenGetter: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokenGetter(getter: () => Promise<string | null>) {
    this.tokenGetter = getter;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.tokenGetter) return {};
    
    const token = await this.tokenGetter();
    if (!token) return {};
    
    return { Authorization: `Bearer ${token}` };
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchConfig } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchWithRetry(
    url: string,
    config: RequestConfig,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<Response> {
    let lastError: Error | null = null;
    const maxAttempts = (config.retries ?? retryConfig.maxRetries) + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, config);

        if (!response.ok && isRetryableError(response.status)) {
          if (attempt < maxAttempts - 1) {
            await sleep(calculateBackoff(attempt, retryConfig));
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiClientError('Request timeout', 408);
        }

        if (attempt < maxAttempts - 1) {
          await sleep(calculateBackoff(attempt, retryConfig));
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const { skipAuth, ...restConfig } = config;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers as Record<string, string>),
    };

    if (!skipAuth) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    const response = await this.fetchWithRetry(url, {
      ...restConfig,
      headers,
    });

    // Handle no content
    if (response.status === 204) {
      return {
        data: null as T,
        status: response.status,
        headers: response.headers,
      };
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw ApiClientError.fromResponse(response, body);
    }

    return {
      data: body as T,
      status: response.status,
      headers: response.headers,
    };
  }

  // Convenience methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
    return response.data;
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }

  async delete<T = void>(endpoint: string, config?: RequestConfig): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
    return response.data;
  }

  // Streaming support for AI responses
  async stream(
    endpoint: string,
    body?: unknown,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`;
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw ApiClientError.fromResponse(response, error);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      onChunk?.(chunk);
    }

    return result;
  }
}

// Create and export singleton instance
export const apiClient = new EnhancedApiClient(env.API_URL);

// API method interfaces for type safety
export interface AgentsApi {
  list(): Promise<PaginatedResponse<Agent>>;
  get(id: string): Promise<Agent>;
  create(data: CreateAgentInput): Promise<Agent>;
  update(id: string, data: UpdateAgentInput): Promise<Agent>;
  delete(id: string): Promise<void>;
  start(id: string): Promise<Agent>;
  stop(id: string): Promise<Agent>;
}

export interface WalletsApi {
  list(): Promise<PaginatedResponse<Wallet>>;
  get(id: string): Promise<Wallet>;
  create(data: CreateWalletInput): Promise<Wallet>;
  getBalance(id: string): Promise<WalletBalance>;
  getTransactions(id: string, params?: PaginationParams): Promise<PaginatedResponse<Transaction>>;
}

export interface AiApi {
  chat(message: string, context?: ChatContext): Promise<ChatResponse>;
  streamChat(message: string, context?: ChatContext, onChunk?: (chunk: string) => void): Promise<string>;
  analyzeIntent(message: string): Promise<IntentAnalysis>;
}

// Types - exported for use in components
export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'paused' | 'error';
  capabilities: string[];
  wallet_address?: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Optional stats
  total_transactions?: number;
  success_rate?: number;
  total_volume?: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  type: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
  status?: 'active' | 'paused' | 'error';
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  network: string;
  type: string;
  created_at: string;
}

export interface CreateWalletInput {
  name: string;
  network?: string;
  type?: string;
}

export interface WalletBalance {
  native: string;
  tokens: Array<{
    address: string;
    symbol: string;
    balance: string;
    decimals: number;
  }>;
}

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface ChatContext {
  agent_id?: string;
  conversation_id?: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  message: string;
  intent?: IntentAnalysis;
  tokens: { input: number; output: number };
}

export interface IntentAnalysis {
  type: string;
  confidence: number;
  entities: Record<string, unknown>;
  suggested_action?: string;
}

// Typed API facades
export const agentsApi: AgentsApi = {
  list: () => apiClient.get('/api/v1/agents/'),
  get: (id) => apiClient.get(`/api/v1/agents/${id}`),
  create: (data) => apiClient.post('/api/v1/agents/', data),
  update: (id, data) => apiClient.put(`/api/v1/agents/${id}`, data),
  delete: (id) => apiClient.delete(`/api/v1/agents/${id}`),
  start: (id) => apiClient.post(`/api/v1/agents/${id}/start`),
  stop: (id) => apiClient.post(`/api/v1/agents/${id}/stop`),
};

export const walletsApi: WalletsApi = {
  list: () => apiClient.get('/api/v1/wallets/'),
  get: (id) => apiClient.get(`/api/v1/wallets/${id}`),
  create: (data) => apiClient.post('/api/v1/wallets/', data),
  getBalance: (id) => apiClient.get(`/api/v1/wallets/${id}/balance`),
  getTransactions: (id, params) => 
    apiClient.get(`/api/v1/wallets/${id}/transactions?${new URLSearchParams(params as Record<string, string>)}`),
};

export const aiApi: AiApi = {
  chat: (message, context) => 
    apiClient.post('/api/v1/ai/chat', { message, ...context }),
  streamChat: (message, context, onChunk) => 
    apiClient.stream('/api/v1/ai/chat/stream', { message, ...context }, onChunk),
  analyzeIntent: (message) => 
    apiClient.post('/api/v1/ai/analyze-intent', { message }),
};
