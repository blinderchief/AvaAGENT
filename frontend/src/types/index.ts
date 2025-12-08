// ===========================================
// AvaAgent Type Definitions
// ===========================================

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  wallet_address?: string;
  created_at: string;
  last_active?: string;
  total_transactions: number;
  success_rate: number;
  spending_limit?: string;
  daily_spent?: string;
  ai_model: string;
  network: NetworkId;
  user_id: string;
}

export type AgentType =
  | "trading"
  | "payment"
  | "commerce"
  | "data"
  | "security"
  | "custom";

export type AgentStatus = "active" | "inactive" | "error";

// Wallet Types
export interface Wallet {
  id: string;
  address: string;
  name: string;
  type: WalletType;
  network: NetworkId;
  balance?: string;
  created_at: string;
  is_smart_wallet: boolean;
  owner_address?: string;
  spending_limit?: string;
  daily_spent?: string;
  whitelisted_tokens?: string[];
  operators?: string[];
}

export type WalletType = "eoa" | "smart" | "agent";

// Transaction Types
export interface Transaction {
  id: string;
  hash?: string;
  type: TransactionType;
  status: TransactionStatus;
  from_address: string;
  to_address: string;
  amount: string;
  token: string;
  gas_used?: string;
  gas_price?: string;
  timestamp: string;
  block_number?: number;
  agent_id?: string;
  wallet_id?: string;
  metadata?: Record<string, any>;
}

export type TransactionType =
  | "send"
  | "receive"
  | "swap"
  | "approve"
  | "contract"
  | "mint"
  | "burn";

export type TransactionStatus = "pending" | "confirming" | "success" | "failed";

// Network Types
export type NetworkId = "avalanche-fuji" | "avalanche-mainnet" | "kite-testnet";

export interface Network {
  id: NetworkId;
  name: string;
  chainId: number;
  chainIdHex: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
}

// Intent Types (ERC-8004)
export interface Intent {
  id: string;
  type: IntentType;
  status: IntentStatus;
  agent_id: string;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  created_at: string;
  executed_at?: string;
  transaction_hash?: string;
}

export type IntentType =
  | "swap"
  | "transfer"
  | "stake"
  | "provide_liquidity"
  | "data_request"
  | "payment"
  | "commerce";

export type IntentStatus = "pending" | "processing" | "completed" | "failed";

// Data Request Types (Turf Network)
export interface DataRequest {
  id: string;
  type: DataRequestType;
  query: string;
  status: DataRequestStatus;
  result?: any;
  sources?: DataSource[];
  attestation_hash?: string;
  created_at: string;
  completed_at?: string;
}

export type DataRequestType =
  | "price"
  | "weather"
  | "social"
  | "market"
  | "custom";

export type DataRequestStatus = "pending" | "fetching" | "verifying" | "completed" | "failed";

export interface DataSource {
  id: string;
  name: string;
  url: string;
  reliability_score: number;
}

// Payment Types (x402)
export interface Payment {
  id: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: string;
  currency: string;
  from_agent_id?: string;
  to_agent_id?: string;
  from_address: string;
  to_address: string;
  memo?: string;
  x402_header?: string;
  transaction_hash?: string;
  created_at: string;
  completed_at?: string;
}

export type PaymentType = "one_time" | "recurring" | "streaming" | "escrow";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

// Commerce Types (Reap Protocol)
export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  stock?: number;
  images?: string[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  products: OrderItem[];
  total_amount: string;
  currency: string;
  shipping_address?: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

// AI Chat Types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  thinking?: string;
  actions?: ChatAction[];
  metadata?: Record<string, any>;
}

export interface ChatAction {
  type: string;
  status: "pending" | "success" | "error";
  data?: any;
  transaction_hash?: string;
}

export interface ChatSession {
  id: string;
  agent_id?: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Stats Types
export interface DashboardStats {
  total_agents: number;
  active_agents: number;
  total_wallets: number;
  total_transactions: number;
  total_volume: string;
  success_rate: number;
  daily_change: {
    agents: number;
    transactions: number;
    volume: number;
  };
}

export interface AgentStats {
  total_transactions: number;
  success_rate: number;
  total_volume: string;
  average_execution_time: number;
  daily_transactions: number[];
  daily_volume: string[];
}
