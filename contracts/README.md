# AvaAgent Smart Contracts

Smart contracts for the AvaAgent platform on Avalanche.

## Contracts

### Core Contracts

- **AvaAgentWallet.sol** - Smart contract wallet with spending limits, operator controls, and batch execution
- **AvaAgentWalletFactory.sol** - Factory for deploying agent wallets
- **AgentRegistry.sol** - Registry for agent discovery and reputation tracking
- **X402PaymentFacilitator.sol** - HTTP 402 payment protocol facilitator
- **IntentProcessor.sol** - ERC-8004 inspired intent processing

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 18+

## Installation

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install eth-infinitism/account-abstraction
```

## Build

```bash
forge build
```

## Test

```bash
forge test -vvv
```

## Deploy

### Avalanche Fuji Testnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export SNOWTRACE_API_KEY=your_api_key

# Deploy
forge script script/Deploy.s.sol:DeployAvaAgent \
    --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
    --broadcast \
    --verify
```

### Kite Testnet

```bash
forge script script/Deploy.s.sol:DeployAvaAgent \
    --rpc-url https://rpc-testnet.gokite.ai/ \
    --broadcast
```

## Contract Addresses

### Avalanche Fuji (Chain ID: 43113)

| Contract | Address | Explorer |
|----------|---------|----------|
| WalletFactory | `0x849Ca487D5DeD85c93fc3600338a419B100833a8` | [View](https://testnet.snowtrace.io/address/0x849Ca487D5DeD85c93fc3600338a419B100833a8) |
| AgentRegistry | `0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28` | [View](https://testnet.snowtrace.io/address/0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28) |
| PaymentFacilitator | `0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF` | [View](https://testnet.snowtrace.io/address/0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF) |
| IntentProcessor | `0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4` | [View](https://testnet.snowtrace.io/address/0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4) |

### Kite Testnet (Chain ID: 2368)

| Contract | Address | Explorer |
|----------|---------|----------|
| WalletFactory | `0x849Ca487D5DeD85c93fc3600338a419B100833a8` | [View](https://testnet.kitescan.ai/address/0x849Ca487D5DeD85c93fc3600338a419B100833a8) |
| AgentRegistry | `0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28` | [View](https://testnet.kitescan.ai/address/0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28) |
| PaymentFacilitator | `0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF` | [View](https://testnet.kitescan.ai/address/0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF) |
| IntentProcessor | `0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4` | [View](https://testnet.kitescan.ai/address/0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4) |

> **Deploy to Kite**: Get KITE tokens from faucet, then run:
> ```bash
> forge script script/Deploy.s.sol:DeployAvaAgent --rpc-url https://rpc-testnet.gokite.ai --broadcast
> ```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AvaAgent Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Wallet     │    │   Agent      │    │   Intent     │  │
│  │   Factory    │───▶│   Registry   │───▶│  Processor   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Agent      │    │  Reputation  │    │   x402       │  │
│  │   Wallet     │    │   System     │    │  Payments    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security

- All contracts use OpenZeppelin's battle-tested implementations
- Reentrancy guards on all state-changing functions
- Pausable functionality for emergency stops
- Access control with Ownable pattern
- Spending limits and operator controls for wallets

## License

MIT
