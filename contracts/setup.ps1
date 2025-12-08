<# 
.SYNOPSIS
    Setup script for AvaAgent smart contracts development on Windows

.DESCRIPTION
    This script helps install Foundry and set up the development environment
    for AvaAgent smart contracts.

.NOTES
    Run this script in PowerShell as Administrator for best results.
#>

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AvaAgent Contracts Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Warning: Not running as Administrator. Some operations may fail." -ForegroundColor Yellow
}

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Step 1: Check for Foundry
Write-Host "Step 1: Checking for Foundry..." -ForegroundColor Green
if (Test-Command "forge") {
    $forgeVersion = forge --version
    Write-Host "  Foundry is installed: $forgeVersion" -ForegroundColor Gray
} else {
    Write-Host "  Foundry not found. Installing..." -ForegroundColor Yellow
    
    # Try to install via cargo first
    if (Test-Command "cargo") {
        Write-Host "  Installing Foundry via Cargo..." -ForegroundColor Gray
        cargo install --git https://github.com/foundry-rs/foundry --profile release --locked forge cast anvil chisel
    } else {
        Write-Host ""
        Write-Host "  Please install Foundry manually:" -ForegroundColor Red
        Write-Host "  Option 1: Download from https://github.com/foundry-rs/foundry/releases" -ForegroundColor White
        Write-Host "            Extract and add to PATH" -ForegroundColor White
        Write-Host ""
        Write-Host "  Option 2: Install Rust first, then run:" -ForegroundColor White
        Write-Host "            cargo install --git https://github.com/foundry-rs/foundry --profile release forge cast anvil" -ForegroundColor White
        Write-Host ""
        Write-Host "  Option 3: Use WSL and run:" -ForegroundColor White
        Write-Host "            curl -L https://foundry.paradigm.xyz | bash && foundryup" -ForegroundColor White
        Write-Host ""
        
        $continue = Read-Host "Press Enter after installing Foundry to continue, or 'q' to quit"
        if ($continue -eq 'q') { exit 1 }
    }
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "Step 2: Installing Foundry dependencies..." -ForegroundColor Green

if (Test-Command "forge") {
    Set-Location $PSScriptRoot
    
    # Create lib directory if it doesn't exist
    if (-not (Test-Path "lib")) {
        New-Item -ItemType Directory -Path "lib" | Out-Null
    }
    
    Write-Host "  Installing OpenZeppelin Contracts..." -ForegroundColor Gray
    forge install OpenZeppelin/openzeppelin-contracts --no-commit 2>$null
    
    Write-Host "  Installing Account Abstraction..." -ForegroundColor Gray
    forge install eth-infinitism/account-abstraction --no-commit 2>$null
    
    Write-Host "  Installing forge-std..." -ForegroundColor Gray
    forge install foundry-rs/forge-std --no-commit 2>$null
    
    Write-Host "  Dependencies installed!" -ForegroundColor Green
} else {
    Write-Host "  Skipping - Foundry not installed" -ForegroundColor Yellow
}

# Step 3: Build contracts
Write-Host ""
Write-Host "Step 3: Building contracts..." -ForegroundColor Green

if (Test-Command "forge") {
    forge build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Build successful!" -ForegroundColor Green
    } else {
        Write-Host "  Build failed. Check errors above." -ForegroundColor Red
    }
} else {
    Write-Host "  Skipping - Foundry not installed" -ForegroundColor Yellow
}

# Step 4: Setup .env file
Write-Host ""
Write-Host "Step 4: Setting up environment..." -ForegroundColor Green

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  Created .env from .env.example" -ForegroundColor Gray
        Write-Host "  Please edit .env and add your PRIVATE_KEY" -ForegroundColor Yellow
    }
} else {
    Write-Host "  .env file already exists" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit .env and add your PRIVATE_KEY" -ForegroundColor Gray
Write-Host "  2. Get testnet AVAX from https://faucet.avax.network/" -ForegroundColor Gray
Write-Host "  3. Run tests: forge test -vvv" -ForegroundColor Gray
Write-Host "  4. Deploy to Fuji:" -ForegroundColor Gray
Write-Host "     forge script script/Deploy.s.sol:DeployAvaAgent --rpc-url avalanche_fuji --broadcast" -ForegroundColor Gray
Write-Host ""
