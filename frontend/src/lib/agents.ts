/**
 * Agents Library
 * 
 * CRUD operations for AI agents via backend API.
 * Handles agent creation, management, and policy configuration.
 */

import { agentsApi, type Agent, type CreateAgentInput, type UpdateAgentInput, type ApiError } from './api-client';

// ============================================================================
// Types
// ============================================================================

export interface AgentPolicy {
  type: 'spend_limit' | 'contract_allowlist' | 'time_lock' | 'intent_required';
  enabled: boolean;
  params: Record<string, unknown>;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'defi' | 'data' | 'commerce' | 'ai' | 'custom';
}

export interface AgentIntent {
  id: string;
  agentId: string;
  action: string;
  params: Record<string, unknown>;
  rationale: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'failed';
  txHash?: string;
  createdAt: string;
  executedAt?: string;
}

export interface AgentMetrics {
  totalTransactions: number;
  successRate: number;
  totalSpentUsd: number;
  intentClarity: number;
  reputationScore: number;
  lastActive?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  defaultPolicies: AgentPolicy[];
  defaultCapabilities: string[];
  category: string;
}

// ============================================================================
// Agent Templates
// ============================================================================

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'defi-trader',
    name: 'DeFi Trader',
    description: 'Automated trading agent with risk controls',
    category: 'DeFi',
    defaultPolicies: [
      { type: 'spend_limit', enabled: true, params: { daily: 100, weekly: 500 } },
      { type: 'contract_allowlist', enabled: true, params: { contracts: [] } },
    ],
    defaultCapabilities: ['swap', 'liquidity', 'yield'],
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Agent for querying and analyzing blockchain data',
    category: 'Data',
    defaultPolicies: [
      { type: 'spend_limit', enabled: true, params: { daily: 10, weekly: 50 } },
    ],
    defaultCapabilities: ['turf_query', 'sentiment', 'on_chain_analytics'],
  },
  {
    id: 'commerce-agent',
    name: 'Commerce Agent',
    description: 'Agent for real-world purchases via Reap',
    category: 'Commerce',
    defaultPolicies: [
      { type: 'spend_limit', enabled: true, params: { daily: 200, perTransaction: 100 } },
      { type: 'intent_required', enabled: true, params: { minAmount: 50 } },
    ],
    defaultCapabilities: ['reap_purchase', 'product_search'],
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'General-purpose AI agent with Gemini integration',
    category: 'AI',
    defaultPolicies: [
      { type: 'spend_limit', enabled: true, params: { daily: 5, weekly: 25 } },
    ],
    defaultCapabilities: ['ai_chat', 'code_generation', 'analysis'],
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Build your own agent from scratch',
    category: 'Custom',
    defaultPolicies: [],
    defaultCapabilities: [],
  },
];

// ============================================================================
// Agent CRUD Operations
// ============================================================================

/**
 * Creates a new agent with the specified configuration
 */
export async function createAgent(input: CreateAgentInput): Promise<Agent> {
  return agentsApi.create(input);
}

/**
 * Creates an agent from a template
 */
export async function createAgentFromTemplate(
  templateId: string,
  overrides: Partial<CreateAgentInput> = {}
): Promise<Agent> {
  const template = AGENT_TEMPLATES.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  
  const input: CreateAgentInput = {
    name: overrides.name || `${template.name} Agent`,
    description: overrides.description || template.description,
    type: overrides.type || template.id,
    capabilities: overrides.capabilities || template.defaultCapabilities,
    ...overrides,
  };
  
  return createAgent(input);
}

/**
 * Fetches an agent by ID
 */
export async function getAgent(agentId: string): Promise<Agent> {
  return agentsApi.get(agentId);
}

/**
 * Lists all agents for the current user
 */
export async function listAgents(): Promise<{ items: Agent[]; total: number; page: number; page_size: number; total_pages: number }> {
  return agentsApi.list();
}

/**
 * Updates an agent's configuration
 */
export async function updateAgent(agentId: string, input: UpdateAgentInput): Promise<Agent> {
  return agentsApi.update(agentId, input);
}

/**
 * Deletes an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  await agentsApi.delete(agentId);
}

/**
 * Activates an agent
 */
export async function activateAgent(agentId: string): Promise<Agent> {
  return updateAgent(agentId, { status: 'active' });
}

/**
 * Pauses an agent
 */
export async function pauseAgent(agentId: string): Promise<Agent> {
  return updateAgent(agentId, { status: 'paused' });
}

// ============================================================================
// Policy Management
// ============================================================================

/**
 * Updates an agent's configuration/policies
 */
export async function updateAgentConfig(
  agentId: string,
  config: Record<string, unknown>
): Promise<Agent> {
  return updateAgent(agentId, { config });
}

/**
 * Adds a contract to the agent's allowlist
 */
export async function addToAllowlist(
  agentId: string,
  contractAddress: string,
  _contractName?: string
): Promise<Agent> {
  const agent = await getAgent(agentId);
  const currentAllowlist = (agent.config?.contract_allowlist as string[]) || [];
  
  if (currentAllowlist.includes(contractAddress.toLowerCase())) {
    return agent;
  }
  
  return updateAgentConfig(agentId, {
    ...agent.config,
    contract_allowlist: [...currentAllowlist, contractAddress.toLowerCase()],
  });
}

/**
 * Removes a contract from the agent's allowlist
 */
export async function removeFromAllowlist(
  agentId: string,
  contractAddress: string
): Promise<Agent> {
  const agent = await getAgent(agentId);
  const currentAllowlist = (agent.config?.contract_allowlist as string[]) || [];
  
  return updateAgentConfig(agentId, {
    ...agent.config,
    contract_allowlist: currentAllowlist.filter(
      addr => addr.toLowerCase() !== contractAddress.toLowerCase()
    ),
  });
}

/**
 * Updates spend limits for an agent
 */
export async function updateSpendLimits(
  agentId: string,
  limits: { daily?: number; weekly?: number; monthly?: number; perTransaction?: number }
): Promise<Agent> {
  const agent = await getAgent(agentId);
  
  return updateAgentConfig(agentId, {
    ...agent.config,
    spend_limit: {
      ...(agent.config?.spend_limit as Record<string, unknown> || {}),
      ...limits,
    },
  });
}

// ============================================================================
// Intent Management
// ============================================================================

/**
 * Fetches intents for an agent
 */
export async function getAgentIntents(
  agentId: string,
  params?: { status?: string; limit?: number }
): Promise<AgentIntent[]> {
  // This would call the intents API endpoint
  const response = await fetch(
    `/api/v1/agents/${agentId}/intents?${new URLSearchParams(params as Record<string, string>).toString()}`,
    { credentials: 'include' }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch intents');
  }
  
  const data = await response.json();
  return data.intents || [];
}

/**
 * Approves a pending intent
 */
export async function approveIntent(agentId: string, intentId: string): Promise<AgentIntent> {
  const response = await fetch(`/api/v1/agents/${agentId}/intents/${intentId}/approve`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to approve intent');
  }
  
  return response.json();
}

/**
 * Rejects a pending intent
 */
export async function rejectIntent(
  agentId: string,
  intentId: string,
  reason?: string
): Promise<AgentIntent> {
  const response = await fetch(`/api/v1/agents/${agentId}/intents/${intentId}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to reject intent');
  }
  
  return response.json();
}

// ============================================================================
// Metrics & Analytics
// ============================================================================

/**
 * Fetches metrics for an agent
 */
export async function getAgentMetrics(agentId: string): Promise<AgentMetrics> {
  const response = await fetch(`/api/v1/agents/${agentId}/metrics`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }
  
  return response.json();
}

/**
 * Calculates reputation score based on metrics
 */
export function calculateReputationScore(metrics: AgentMetrics): number {
  const weights = {
    successRate: 0.4,
    intentClarity: 0.3,
    transactionVolume: 0.2,
    age: 0.1,
  };
  
  const successScore = metrics.successRate * 100;
  const clarityScore = metrics.intentClarity * 100;
  const volumeScore = Math.min(metrics.totalTransactions / 100, 1) * 100;
  const ageScore = metrics.lastActive ? 100 : 50;
  
  return Math.round(
    successScore * weights.successRate +
    clarityScore * weights.intentClarity +
    volumeScore * weights.transactionVolume +
    ageScore * weights.age
  );
}

// ============================================================================
// Capability Definitions
// ============================================================================

export const AGENT_CAPABILITIES: AgentCapability[] = [
  // DeFi Capabilities
  { id: 'swap', name: 'Token Swap', description: 'Swap tokens on DEXes', enabled: true, category: 'defi' },
  { id: 'liquidity', name: 'Liquidity Provision', description: 'Provide liquidity to pools', enabled: true, category: 'defi' },
  { id: 'yield', name: 'Yield Farming', description: 'Farm yields across protocols', enabled: true, category: 'defi' },
  { id: 'lending', name: 'Lending/Borrowing', description: 'Lend and borrow assets', enabled: true, category: 'defi' },
  
  // Data Capabilities
  { id: 'turf_query', name: 'Turf Data Query', description: 'Query data from Turf Network', enabled: true, category: 'data' },
  { id: 'sentiment', name: 'Sentiment Analysis', description: 'Analyze market sentiment', enabled: true, category: 'data' },
  { id: 'on_chain_analytics', name: 'On-Chain Analytics', description: 'Analyze on-chain data', enabled: true, category: 'data' },
  { id: 'price_feeds', name: 'Price Feeds', description: 'Access real-time price data', enabled: true, category: 'data' },
  
  // Commerce Capabilities
  { id: 'reap_purchase', name: 'Reap Purchase', description: 'Purchase products via Reap', enabled: true, category: 'commerce' },
  { id: 'product_search', name: 'Product Search', description: 'Search for products', enabled: true, category: 'commerce' },
  { id: 'inventory_check', name: 'Inventory Check', description: 'Verify product availability', enabled: true, category: 'commerce' },
  
  // AI Capabilities
  { id: 'ai_chat', name: 'AI Chat', description: 'Conversational AI interactions', enabled: true, category: 'ai' },
  { id: 'code_generation', name: 'Code Generation', description: 'Generate code with AI', enabled: true, category: 'ai' },
  { id: 'analysis', name: 'Data Analysis', description: 'AI-powered data analysis', enabled: true, category: 'ai' },
  { id: 'summarization', name: 'Summarization', description: 'Summarize content with AI', enabled: true, category: 'ai' },
];

/**
 * Gets capabilities by category
 */
export function getCapabilitiesByCategory(category: AgentCapability['category']): AgentCapability[] {
  return AGENT_CAPABILITIES.filter(cap => cap.category === category);
}

/**
 * Validates if an agent has required capabilities for an action
 */
export function hasCapability(agent: Agent, capabilityId: string): boolean {
  return agent.capabilities?.includes(capabilityId) ?? false;
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
  ApiError,
};
