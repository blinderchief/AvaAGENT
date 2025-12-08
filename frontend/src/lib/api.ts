const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, token } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Convenience methods
  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  async post<T>(endpoint: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, token });
  }

  async put<T>(endpoint: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, token });
  }

  async patch<T>(endpoint: string, body?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, token });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }

  // Agents
  async getAgents(token: string) {
    return this.request('/api/v1/agents/', { token });
  }

  async createAgent(token: string, data: CreateAgentRequest) {
    return this.request('/api/v1/agents/', {
      method: 'POST',
      body: data,
      token,
    });
  }

  async getAgent(token: string, agentId: string) {
    return this.request(`/api/v1/agents/${agentId}`, { token });
  }

  async updateAgent(token: string, agentId: string, data: UpdateAgentRequest) {
    return this.request(`/api/v1/agents/${agentId}`, {
      method: 'PUT',
      body: data,
      token,
    });
  }

  async deleteAgent(token: string, agentId: string) {
    return this.request(`/api/v1/agents/${agentId}`, {
      method: 'DELETE',
      token,
    });
  }

  // Wallets
  async getWallets(token: string) {
    return this.request('/api/v1/wallets/', { token });
  }

  async createWallet(token: string, data: CreateWalletRequest) {
    return this.request('/api/v1/wallets/', {
      method: 'POST',
      body: data,
      token,
    });
  }

  // AI Chat
  async chat(token: string, message: string, context?: ChatMessage[]) {
    return this.request<ChatResponse>('/api/v1/ai/chat', {
      method: 'POST',
      body: { message, context },
      token,
    });
  }

  async analyzeIntent(token: string, message: string) {
    return this.request('/api/v1/ai/analyze-intent', {
      method: 'POST',
      body: { message },
      token,
    });
  }

  // Data
  async getPrice(token: string, asset: string) {
    return this.request(`/api/v1/data/price/${asset}`, { token });
  }

  // Commerce
  async searchProducts(token: string, query: string) {
    return this.request('/api/v1/commerce/search', {
      method: 'POST',
      body: { query },
      token,
    });
  }
}

// Types
interface CreateAgentRequest {
  name: string;
  description?: string;
  agent_type: string;
  config?: Record<string, unknown>;
}

interface UpdateAgentRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
}

interface CreateWalletRequest {
  name: string;
  wallet_type?: string;
  network?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  tokens: {
    input: number;
    output: number;
  };
}

export const api = new ApiClient(API_URL);
export type { CreateAgentRequest, UpdateAgentRequest, CreateWalletRequest, ChatMessage, ChatResponse };
