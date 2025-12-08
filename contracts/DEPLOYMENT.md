# AvaAgent Contracts - Deployment Guide

## Prerequisites Setup

### Option 1: Install Foundry on Windows (Recommended)

1. **Install Foundry using foundryup-windows**
   
   Open PowerShell as Administrator and run:
   ```powershell
   # Download and run the Windows installer
   Invoke-WebRequest -Uri https://raw.githubusercontent.com/foundry-rs/foundry/master/foundryup/install.ps1 -OutFile foundryup.ps1
   .\foundryup.ps1
   
   # Or use cargo (if you have Rust installed)
   cargo install --git https://github.com/foundry-rs/foundry --profile release foundry-cli anvil chisel
   ```

2. **Alternative: Use pre-built binaries**
   
   Download from: https://github.com/foundry-rs/foundry/releases
   - Download `foundry_nightly_win32_amd64.zip`
   - Extract to a folder (e.g., `C:\foundry`)
   - Add to PATH: `$env:Path += ";C:\foundry"`

### Option 2: Use WSL (Windows Subsystem for Linux)

```bash
# In WSL terminal
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

## Install Dependencies

Once Foundry is installed, run:

```bash
cd contracts

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Install Account Abstraction (for ERC-4337)
forge install eth-infinitism/account-abstraction --no-commit

# Install forge-std (testing utilities)
forge install foundry-rs/forge-std --no-commit
```

## Environment Setup

Create a `.env` file in the contracts folder:

```env
# Deployer private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Snowtrace API key for verification (optional)
SNOWTRACE_API_KEY=your_snowtrace_api_key

# RPC URLs (optional - defaults in foundry.toml)
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
KITE_TESTNET_RPC=https://rpc-testnet.gokite.ai/
```

## Build Contracts

```bash
forge build
```

## Run Tests

```bash
forge test -vvv
```

## Deploy to Avalanche Fuji Testnet

```bash
# Load environment variables
source .env  # Linux/WSL
# or in PowerShell: Get-Content .env | ForEach-Object { $var = $_.Split('='); [Environment]::SetEnvironmentVariable($var[0], $var[1]) }

# Deploy
forge script script/Deploy.s.sol:DeployAvaAgent \
    --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
    --broadcast \
    --verify \
    -vvvv

# If verification fails, verify manually:
forge verify-contract <CONTRACT_ADDRESS> src/wallet/AvaAgentWalletFactory.sol:AvaAgentWalletFactory \
    --chain-id 43113 \
    --etherscan-api-key $SNOWTRACE_API_KEY
```

## Deploy to Kite Testnet

```bash
forge script script/Deploy.s.sol:DeployAvaAgent \
    --rpc-url https://rpc-testnet.gokite.ai/ \
    --broadcast \
    -vvvv
```

## Get Testnet Tokens

### Avalanche Fuji AVAX
- Faucet: https://faucet.avax.network/
- Select "Fuji (C-Chain)"
- Enter your wallet address
- Request 2 AVAX

### Kite Testnet
- Check Kite documentation for faucet availability

## Contract Addresses After Deployment

Update these in your `.env` files after deployment:

```env
# Avalanche Fuji
NEXT_PUBLIC_WALLET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PAYMENTS_ADDRESS=0x...
NEXT_PUBLIC_INTENTS_ADDRESS=0x...

# Kite Testnet
NEXT_PUBLIC_KITE_WALLET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_KITE_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_KITE_PAYMENTS_ADDRESS=0x...
NEXT_PUBLIC_KITE_INTENTS_ADDRESS=0x...
```

## Troubleshooting

### "forge not found"
- Ensure Foundry binaries are in your PATH
- Restart your terminal after installation

### "Cannot find remapped import"
- Run `forge install` to install all dependencies
- Check `foundry.toml` remappings match installed packages

### "Insufficient funds"
- Get testnet tokens from faucet
- Check you're on the correct network

### Verification failing
- Snowtrace API key may not be needed for Fuji
- Try with `--skip-simulation` flag
- Flatten contract first: `forge flatten src/wallet/AvaAgentWallet.sol`
