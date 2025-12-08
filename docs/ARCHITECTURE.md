# AvaAgent Architecture Documentation

## Overview

AvaAgent is a production-ready agentic infrastructure platform built on Avalanche that enables autonomous AI agents to execute on-chain transactions with configurable policies and guardrails.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AvaAgent Platform                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │   Next.js 14     │    │    FastAPI       │    │  Smart Contracts │      │
│  │   Frontend       │◄──►│    Backend       │◄──►│  (Foundry)       │      │
│  │                  │    │                  │    │                  │      │
│  │  • App Router    │    │  • Agent CRUD    │    │  • AgentRegistry │      │
│  │  • Tailwind CSS  │    │  • x402 Payment  │    │  • PolicyManager │      │
│  │  • shadcn/ui     │    │  • AI Inference  │    │  • PaymentRouter │      │
│  │  • Clerk Auth    │    │  • Reap Commerce │    │                  │      │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘      │
│           │                       │                        │               │
│           ▼                       ▼                        ▼               │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │   Thirdweb v5    │    │  Neon PostgreSQL │    │  Avalanche Fuji  │      │
│  │                  │    │                  │    │  + Kite Testnet  │      │
│  │  • Connect SDK   │    │  • SQLAlchemy    │    │                  │      │
│  │  • ERC-4337 AA   │    │  • Async/Await   │    │  Chain ID: 43113 │      │
│  │  • x402 Payments │    │  • Migrations    │    │  Chain ID: 2368  │      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

External Integrations:
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Google       │  │  x402         │  │  Reap         │  │  Turf         │
│  Gemini AI    │  │  Protocol     │  │  Protocol     │  │  Network      │
│               │  │               │  │               │  │               │
│  gemini-2.0   │  │  HTTP 402     │  │  Commerce     │  │  Data         │
│  -flash       │  │  Payments     │  │  API          │  │  Queries      │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
```

## Component Details

### Frontend (Next.js 14)

```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Protected dashboard
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── agent/             # Agent management UI
│   │   ├── x402/              # Payment components
│   │   ├── reap/              # Commerce components
│   │   └── ui/                # shadcn/ui primitives
│   ├── lib/
│   │   ├── thirdweb.ts        # Wallet & payments
│   │   ├── agents.ts          # Agent operations
│   │   ├── turf.ts            # Data queries
│   │   └── utils.ts           # Helpers
│   └── hooks/                 # Custom React hooks
├── public/                    # Static assets
└── package.json
```

**Key Technologies:**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (persist) + TanStack Query
- **Auth**: Clerk (JWT + middleware)
- **Wallet**: Thirdweb v5 Connect SDK

### Backend (FastAPI)

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── agents.py      # Agent CRUD endpoints
│   │       ├── inference.py   # AI inference
│   │       ├── x402.py        # Payment processing
│   │       └── reap.py        # Commerce integration
│   ├── core/
│   │   ├── config.py          # Settings
│   │   ├── security.py        # Auth utilities
│   │   └── database.py        # DB connection
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   └── services/
│       ├── agent_service.py   # Business logic
│       ├── ai_service.py      # Gemini integration
│       └── payment_service.py # x402 handling
├── migrations/                # Alembic migrations
├── tests/                     # pytest tests
└── requirements.txt
```

**Key Technologies:**
- **Framework**: FastAPI 0.100+
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: Neon PostgreSQL
- **Auth**: Clerk JWT verification
- **AI**: Google Gemini API

### Smart Contracts (Foundry)

```
contracts/
├── src/
│   ├── AgentRegistry.sol      # Agent registration
│   ├── PolicyManager.sol      # Policy enforcement
│   ├── PaymentRouter.sol      # x402 payment routing
│   └── interfaces/
│       └── IAgent.sol         # Agent interface
├── script/
│   └── Deploy.s.sol           # Deployment script
├── test/
│   └── *.t.sol                # Foundry tests
└── foundry.toml
```

**Key Technologies:**
- **Framework**: Foundry
- **Solidity**: 0.8.24
- **Libraries**: OpenZeppelin
- **Networks**: Avalanche Fuji (43113), Kite (2368)

## Data Flow

### 1. Agent Creation Flow

```
User → Frontend → Backend API → Database
                      ↓
              Smart Contract (Registry)
                      ↓
                  Blockchain
```

### 2. AI Inference with x402 Payment

```
User Request → Check Payment Required (402)
                    ↓
              Create Payment Intent
                    ↓
              Wallet Signs Transaction
                    ↓
              Backend Verifies Payment
                    ↓
              Execute AI Inference
                    ↓
              Return Response
```

### 3. Agent Execution Flow

```
Intent Received → Policy Check → Execute Action
        ↓              ↓              ↓
   Validate       Check Limits    Call Contract
        ↓              ↓              ↓
   Queue/Reject   Approve/Deny   Tx Submitted
```

## Security Architecture

### Authentication Layers

1. **Frontend**: Clerk session management
2. **API**: JWT token verification
3. **Wallet**: Thirdweb signature verification
4. **Contracts**: Access control modifiers

### Policy Enforcement

```solidity
struct Policy {
    uint256 spendLimit;      // Max spend per period
    uint256 periodDuration;  // Reset interval
    address[] allowlist;     // Allowed contracts
    bool requireApproval;    // Manual approval flag
    uint256 timeLock;        // Delay before execution
}
```

### Rate Limiting

- API: 100 req/min per user
- Inference: 10 req/min per user
- x402 payments: 20 req/min per wallet

## Deployment Architecture

### Development

```
localhost:3000 (Frontend)
localhost:8000 (Backend)
Avalanche Fuji (Testnet)
```

### Production

```
Vercel (Frontend)
Railway/Render (Backend)
Neon (Database)
Avalanche Mainnet
```

## API Endpoints

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/agents | List user agents |
| POST | /api/v1/agents | Create agent |
| GET | /api/v1/agents/:id | Get agent details |
| PATCH | /api/v1/agents/:id | Update agent |
| DELETE | /api/v1/agents/:id | Delete agent |

### Inference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/inference | Execute inference |
| POST | /api/v1/inference/stream | Streaming inference |

### x402 Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/x402/check/:resource | Check payment status |
| POST | /api/v1/x402/intent | Create payment intent |
| POST | /api/v1/x402/verify | Verify payment |

### Reap Commerce

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/reap/products | Search products |
| POST | /api/v1/reap/cart/add | Add to cart |
| POST | /api/v1/reap/checkout | Process checkout |

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| API Response Time | < 200ms | ~150ms |
| Inference Latency | < 3s | ~2.5s |
| Payment Verification | < 5s | ~3s |
| Frontend Load | < 2s | ~1.5s |

## Monitoring

- **Logs**: Structured JSON logging
- **Metrics**: Prometheus-compatible
- **Tracing**: OpenTelemetry
- **Alerts**: Sentry integration

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...
```

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://...
CLERK_SECRET_KEY=sk_...
GOOGLE_AI_API_KEY=...
THIRDWEB_SECRET_KEY=...
X402_FACILITATOR_ADDRESS=0x...
```

## References

- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [Thirdweb v5 Docs](https://portal.thirdweb.com/typescript/v5)
- [Reap Protocol](https://docs.reap.xyz)
- [Avalanche Docs](https://docs.avax.network)
