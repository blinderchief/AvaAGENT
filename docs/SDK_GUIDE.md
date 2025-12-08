# AvaAgent SDK Integration Guide

## Overview

This guide covers integration with AvaAgent's TypeScript/JavaScript SDK for building applications that interact with autonomous AI agents on Avalanche.

## Installation

```bash
# npm
npm install @avaagent/sdk

# yarn
yarn add @avaagent/sdk

# pnpm
pnpm add @avaagent/sdk
```

## Quick Start

```typescript
import { AvaAgent, createClient } from '@avaagent/sdk';

// Initialize client
const client = createClient({
  apiKey: process.env.AVAAGENT_API_KEY,
  network: 'fuji', // or 'mainnet'
});

// Create an agent
const agent = await client.agents.create({
  name: 'My Trading Bot',
  type: 'defi',
  model: 'gemini-2.0-flash',
  policy: {
    spendLimitUsd: 100,
    spendLimitPeriod: 'daily',
    allowedContracts: ['0x...'],
  },
});

// Execute an intent
const result = await agent.execute({
  action: 'swap',
  params: {
    fromToken: 'AVAX',
    toToken: 'USDC',
    amount: '1.0',
  },
});
```

## Authentication

### API Key Authentication

```typescript
const client = createClient({
  apiKey: 'your-api-key',
});
```

### Wallet Authentication

```typescript
import { createClient, WalletAuth } from '@avaagent/sdk';
import { createThirdwebClient } from 'thirdweb';

const thirdwebClient = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID,
});

const client = createClient({
  auth: new WalletAuth({
    thirdwebClient,
    wallet: connectedWallet,
  }),
});
```

## Agent Management

### Creating Agents

```typescript
// Basic agent
const agent = await client.agents.create({
  name: 'Research Assistant',
  type: 'research',
  model: 'gemini-2.0-flash',
});

// Agent with full configuration
const advancedAgent = await client.agents.create({
  name: 'DeFi Trader',
  description: 'Autonomous trading agent for yield optimization',
  type: 'defi',
  model: 'gemini-2.0-flash',
  config: {
    strategy: 'yield_optimization',
    maxSlippage: 0.5,
    preferredDexs: ['trader_joe', 'pangolin'],
  },
  policy: {
    spendLimitUsd: 1000,
    spendLimitPeriod: 'daily',
    allowedContracts: [
      '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', // TraderJoe
    ],
    allowedTokens: ['AVAX', 'USDC', 'WAVAX'],
    requireApproval: false,
    timeLockHours: 0,
  },
});
```

### Listing Agents

```typescript
// List all agents
const agents = await client.agents.list();

// Filter by type
const defiAgents = await client.agents.list({
  type: 'defi',
  status: 'active',
});

// Pagination
const page = await client.agents.list({
  page: 1,
  limit: 10,
});
```

### Updating Agents

```typescript
await client.agents.update(agentId, {
  name: 'Updated Name',
  policy: {
    spendLimitUsd: 500, // Reduced limit
  },
});
```

### Deleting Agents

```typescript
await client.agents.delete(agentId);
```

## Intent Execution

### Basic Execution

```typescript
const result = await agent.execute({
  action: 'query',
  params: {
    source: 'turf',
    query: 'AVAX TVL trend',
  },
});

console.log(result.data);
```

### Streaming Execution

```typescript
const stream = await agent.executeStream({
  action: 'analyze',
  params: {
    topic: 'Avalanche DeFi ecosystem',
  },
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Transaction Execution

```typescript
// Requires wallet connection
const txResult = await agent.execute({
  action: 'swap',
  params: {
    fromToken: 'AVAX',
    toToken: 'USDC',
    amount: '10.0',
    slippage: 0.5,
  },
});

console.log('Transaction hash:', txResult.txHash);
console.log('Received:', txResult.received);
```

## x402 Payments

### Checking Payment Requirements

```typescript
const paymentCheck = await client.x402.check('/api/v1/inference');

if (paymentCheck.required) {
  console.log('Payment required:', paymentCheck.amount, 'USDC');
}
```

### Creating Payment Intent

```typescript
const intent = await client.x402.createIntent({
  resource: '/api/v1/inference',
  amount: '1000000', // 1 USDC (6 decimals)
});

console.log('Pay to:', intent.payTo);
console.log('Amount:', intent.amount);
```

### Processing Payment

```typescript
import { processX402Payment } from '@avaagent/sdk';

const receipt = await processX402Payment({
  client,
  wallet: connectedWallet,
  resource: '/api/v1/inference',
  amount: '1000000',
});

console.log('Payment successful:', receipt.txHash);
```

### Verifying Payment

```typescript
const verified = await client.x402.verify({
  txHash: receipt.txHash,
  resource: '/api/v1/inference',
});

if (verified.valid) {
  // Payment confirmed, proceed with request
}
```

## Reap Commerce Integration

### Searching Products

```typescript
const products = await client.reap.searchProducts({
  query: 'gaming',
  category: 'electronics',
  maxPrice: 100,
});

for (const product of products.items) {
  console.log(product.name, '-', product.price, 'USDC');
}
```

### Cart Management

```typescript
// Create cart
const cart = await client.reap.createCart();

// Add items
await client.reap.addToCart(cart.id, {
  productId: 'product-123',
  quantity: 2,
});

// Get cart summary
const summary = await client.reap.getCart(cart.id);
console.log('Total:', summary.total, 'USDC');
```

### Checkout

```typescript
const order = await client.reap.checkout({
  cartId: cart.id,
  walletAddress: userWallet.address,
  shippingAddress: {
    name: 'John Doe',
    address: '123 Main St',
    city: 'New York',
    country: 'US',
  },
});

console.log('Order ID:', order.id);
console.log('Status:', order.status);
```

## Turf Data Queries

### Basic Query

```typescript
const data = await client.turf.query({
  source: 'defillama',
  query: 'avalanche tvl history',
});

console.log('Data points:', data.results.length);
```

### Paid Query with x402

```typescript
const data = await client.turf.queryWithPayment({
  source: 'premium',
  query: 'detailed market analysis',
  wallet: connectedWallet,
});
```

## Event Listeners

### Agent Events

```typescript
agent.on('intent:created', (intent) => {
  console.log('New intent:', intent.action);
});

agent.on('intent:completed', (intent) => {
  console.log('Intent completed:', intent.id);
});

agent.on('intent:failed', (intent, error) => {
  console.error('Intent failed:', error.message);
});
```

### Payment Events

```typescript
client.x402.on('payment:required', (info) => {
  console.log('Payment required for:', info.resource);
});

client.x402.on('payment:completed', (receipt) => {
  console.log('Payment confirmed:', receipt.txHash);
});
```

## Error Handling

```typescript
import { AvaAgentError, PaymentRequiredError, PolicyViolationError } from '@avaagent/sdk';

try {
  await agent.execute({
    action: 'swap',
    params: { /* ... */ },
  });
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    // Handle payment requirement
    await processPayment(error.paymentInfo);
  } else if (error instanceof PolicyViolationError) {
    // Handle policy violation
    console.error('Policy violated:', error.policy, error.violation);
  } else if (error instanceof AvaAgentError) {
    // Handle general errors
    console.error('Error:', error.code, error.message);
  } else {
    throw error;
  }
}
```

## TypeScript Types

```typescript
import type {
  Agent,
  AgentConfig,
  AgentPolicy,
  AgentType,
  Intent,
  IntentResult,
  PaymentReceipt,
  Product,
  CartItem,
} from '@avaagent/sdk';

// Type-safe agent creation
const config: AgentConfig = {
  strategy: 'conservative',
  maxSlippage: 0.5,
};

const policy: AgentPolicy = {
  spendLimitUsd: 100,
  spendLimitPeriod: 'daily',
  allowedContracts: [],
  requireApproval: true,
};
```

## React Hooks

```typescript
import { 
  useAvaAgent, 
  useAgents, 
  useAgent, 
  useX402Payment 
} from '@avaagent/sdk/react';

function MyComponent() {
  const { client, isConnected } = useAvaAgent();
  const { agents, isLoading } = useAgents();
  const { agent, execute, isExecuting } = useAgent(agentId);
  const { pay, isPaying, receipt } = useX402Payment();

  const handleExecute = async () => {
    const result = await execute({
      action: 'query',
      params: { query: 'test' },
    });
  };

  return (
    <div>
      {agents.map(agent => (
        <div key={agent.id}>{agent.name}</div>
      ))}
    </div>
  );
}
```

## Configuration Options

```typescript
const client = createClient({
  // Required
  apiKey: 'your-api-key',

  // Network configuration
  network: 'fuji', // 'fuji' | 'mainnet' | 'kite'
  
  // Custom endpoints
  apiUrl: 'https://api.avaagent.xyz',
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',

  // Timeouts
  timeout: 30000, // 30 seconds
  retries: 3,

  // Logging
  debug: true,
  logger: customLogger,

  // Cache
  cache: true,
  cacheTime: 60000, // 1 minute
});
```

## Best Practices

### 1. Use Environment Variables

```typescript
// ❌ Bad
const client = createClient({
  apiKey: 'sk_live_1234567890',
});

// ✅ Good
const client = createClient({
  apiKey: process.env.AVAAGENT_API_KEY!,
});
```

### 2. Handle Errors Gracefully

```typescript
// ❌ Bad
const result = await agent.execute(intent);

// ✅ Good
try {
  const result = await agent.execute(intent);
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    // Handle payment
  }
  // Handle other errors
}
```

### 3. Use Streaming for Long Operations

```typescript
// ❌ Bad (for long responses)
const result = await agent.execute(longQuery);

// ✅ Good
const stream = await agent.executeStream(longQuery);
for await (const chunk of stream) {
  updateUI(chunk);
}
```

### 4. Implement Retry Logic

```typescript
import { retry } from '@avaagent/sdk/utils';

const result = await retry(
  () => agent.execute(intent),
  {
    maxRetries: 3,
    backoff: 'exponential',
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error.message);
    },
  }
);
```

## Support

- **Documentation**: https://docs.avaagent.xyz
- **Discord**: https://discord.gg/avaagent
- **GitHub**: https://github.com/avaagent/sdk
- **Email**: support@avaagent.xyz
