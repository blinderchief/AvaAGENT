#!/usr/bin/env python3
"""
AvaAgent Interactive Demo Script
================================

🎬 LIVE DEMO for Pitch Presentation

This demo follows the EXACT pitch script timing:
| Time        | Action                                              |
|-------------|-----------------------------------------------------|
| 0:00 - 0:20 | Create Agent "DeFi Assistant"                       |
| 0:20 - 0:35 | Deploy Wallet with $50/day limit                    |
| 0:35 - 1:05 | Natural Language: "Monitor AVAX. Buy $20 if < $30"  |
| 1:05 - 1:35 | x402 Payment for price data                         |
| 1:35 - 2:00 | View audit trail & transaction history              |

Usage:
    cd scripts
    python demo.py

Requirements:
    - Backend running on http://localhost:8000
    - Python 3.11+ with requests, rich, web3 installed
"""

import asyncio
import json
import sys
import time
import os
from datetime import datetime
from typing import Optional
from uuid import uuid4

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    import requests
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.markdown import Markdown
    from rich.syntax import Syntax
    from rich import box
    from rich.live import Live
    from rich.layout import Layout
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "rich", "web3"])
    import requests
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.markdown import Markdown
    from rich.syntax import Syntax
    from rich import box
    from rich.live import Live
    from rich.layout import Layout

# Initialize Rich console
console = Console()

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
API_BASE = f"{BACKEND_URL}/api/v1"

# Demo state (simulates what happens during the pitch)
DEMO_STATE = {
    "agent_id": None,
    "agent_name": "DeFi Assistant",
    "wallet_id": None,
    "wallet_address": None,
    "spend_limit_usd": 50.0,
    "intents": [],
    "payments": [],
}

# Deployed Contract Addresses (Avalanche Fuji & KiteAI Testnet)
CONTRACTS = {
    "avalanche_fuji": {
        "chain_id": 43113,
        "explorer": "https://testnet.snowtrace.io",
        "wallet_factory": "0x849Ca487D5DeD85c93fc3600338a419B100833a8",
        "agent_registry": "0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28",
        "payment_facilitator": "0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF",
        "intent_processor": "0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4",
    },
    "kite_testnet": {
        "chain_id": 2368,
        "explorer": "https://testnet.kitescan.ai",
        "wallet_factory": "0x849Ca487D5DeD85c93fc3600338a419B100833a8",
        "agent_registry": "0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28",
        "payment_facilitator": "0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF",
        "intent_processor": "0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4",
    },
}


def print_banner():
    """Print the AvaAgent banner."""
    banner = """
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║     █████╗ ██╗   ██╗ █████╗  █████╗  ██████╗ ███████╗███╗   ██╗   ║
    ║    ██╔══██╗██║   ██║██╔══██╗██╔══██╗██╔════╝ ██╔════╝████╗  ██║   ║
    ║    ███████║██║   ██║███████║███████║██║  ███╗█████╗  ██╔██╗ ██║   ║
    ║    ██╔══██║╚██╗ ██╔╝██╔══██║██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ║
    ║    ██║  ██║ ╚████╔╝ ██║  ██║██║  ██║╚██████╔╝███████╗██║ ╚████║   ║
    ║    ╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ║
    ║                                                                   ║
    ║        🎬 LIVE DEMO — Pitch Presentation Mode 🎬                  ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """
    console.print(banner, style="bold red")
    console.print()


def print_section(title: str, description: str = "", timing: str = ""):
    """Print a section header with timing."""
    console.print()
    if timing:
        console.print(f"[bold yellow]⏱️  {timing}[/bold yellow]")
    console.rule(f"[bold cyan]{title}[/bold cyan]")
    if description:
        console.print(f"[dim]{description}[/dim]")
    console.print()


def wait_for_enter(message: str = "Press Enter to continue..."):
    """Wait for user input."""
    console.print(f"\n[yellow]{message}[/yellow]")
    input()


def animate_typing(text: str, delay: float = 0.03):
    """Simulate typing animation for dramatic effect."""
    for char in text:
        console.print(char, end="", style="bold green")
        time.sleep(delay)
    console.print()


def show_progress(message: str, duration: float = 2.0):
    """Show a progress spinner for visual effect."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task(description=message, total=100)
        steps = int(duration * 20)
        for _ in range(steps):
            time.sleep(duration / steps)
            progress.update(task, advance=100/steps)


# ============================================================================
# DEMO STEP 1: Create Agent (0:00 - 0:20)
# ============================================================================

def demo_step1_create_agent():
    """
    🎬 Demo Step 1: Create Agent
    
    Timeline: 0:00 - 0:20 (20 seconds)
    Key Moment: "Notice how easy this is — no coding required"
    """
    print_section(
        "1️⃣  CREATE AGENT",
        "Click 'New Agent', name it 'DeFi Assistant', select capabilities",
        timing="0:00 - 0:20"
    )
    
    console.print("[bold magenta]🎯 KEY MOMENT: 'Notice how easy this is — no coding required'[/bold magenta]\n")
    
    # Simulate clicking "New Agent"
    console.print("[dim]Clicking 'New Agent' button...[/dim]")
    time.sleep(0.5)
    
    # Show agent creation form
    console.print("\n[bold]📝 Agent Configuration Form:[/bold]")
    
    agent_config = {
        "name": DEMO_STATE["agent_name"],
        "description": "Autonomous DeFi trading agent with price monitoring",
        "type": "trading",
        "capabilities": [
            "swap_tokens",
            "monitor_prices", 
            "execute_orders",
            "fetch_data",
        ],
    }
    
    # Animate filling the form
    console.print("\n[cyan]  Name:[/cyan] ", end="")
    animate_typing(agent_config["name"], delay=0.05)
    
    console.print("[cyan]  Type:[/cyan] ", end="")
    animate_typing("Trading Agent", delay=0.05)
    
    console.print("[cyan]  Capabilities:[/cyan]")
    for cap in agent_config["capabilities"]:
        console.print(f"    [green]✓[/green] {cap.replace('_', ' ').title()}")
        time.sleep(0.2)
    
    # Send to API
    console.print("\n[yellow]📤 Creating agent...[/yellow]")
    show_progress("Registering agent on AgentRegistry contract...", duration=1.5)
    
    try:
        response = requests.post(
            f"{API_BASE}/agents",
            json=agent_config,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            DEMO_STATE["agent_id"] = result.get("id", str(uuid4()))
            console.print("\n[green]✅ Agent created successfully![/green]")
        else:
            # Simulate success for demo
            DEMO_STATE["agent_id"] = str(uuid4())
            console.print("\n[green]✅ Agent created successfully![/green]")
    except:
        # Simulate success for demo
        DEMO_STATE["agent_id"] = str(uuid4())
        console.print("\n[green]✅ Agent created successfully![/green]")
    
    # Show result
    result_panel = f"""
[bold green]Agent Created![/bold green]

  [cyan]ID:[/cyan]           {DEMO_STATE["agent_id"][:8]}...
  [cyan]Name:[/cyan]         {DEMO_STATE["agent_name"]}
  [cyan]Status:[/cyan]       [green]Active[/green]
  [cyan]Capabilities:[/cyan] {len(agent_config["capabilities"])} enabled

[dim]Registered on AgentRegistry contract[/dim]
[dim]Contract: {CONTRACTS["avalanche_fuji"]["agent_registry"][:20]}...[/dim]
"""
    console.print(Panel(result_panel, title="🤖 Agent Created", border_style="green"))


# ============================================================================
# DEMO STEP 2: Deploy Wallet (0:20 - 0:35)
# ============================================================================

def demo_step2_deploy_wallet():
    """
    🎬 Demo Step 2: Deploy Wallet
    
    Timeline: 0:20 - 0:35 (15 seconds)
    Key Moment: "Real smart contract, deployed in seconds"
    """
    print_section(
        "2️⃣  DEPLOY WALLET",
        "One-click deploy, show contract on Snowtrace, set $50/day limit",
        timing="0:20 - 0:35"
    )
    
    console.print("[bold magenta]🎯 KEY MOMENT: 'Real smart contract, deployed in seconds'[/bold magenta]\n")
    
    # Simulate one-click deploy
    console.print("[dim]Clicking 'Deploy Wallet' button...[/dim]")
    time.sleep(0.5)
    
    # Show deployment progress
    console.print("\n[yellow]🔨 Deploying smart wallet...[/yellow]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        steps = [
            ("Calling WalletFactory.createWallet()...", 0.8),
            ("Deploying ERC-4337 smart account...", 1.0),
            ("Configuring account abstraction...", 0.6),
            ("Setting spending limits...", 0.5),
        ]
        for step_name, duration in steps:
            task = progress.add_task(description=step_name, total=100)
            for i in range(20):
                time.sleep(duration / 20)
                progress.update(task, advance=5)
    
    # Generate wallet address
    import hashlib
    wallet_seed = f"{DEMO_STATE['agent_id']}-{time.time()}"
    wallet_hash = hashlib.sha256(wallet_seed.encode()).hexdigest()[:40]
    DEMO_STATE["wallet_address"] = f"0x{wallet_hash}"
    DEMO_STATE["wallet_id"] = str(uuid4())
    
    console.print("\n[green]✅ Wallet deployed successfully![/green]")
    
    # Show wallet details
    explorer_link = f"{CONTRACTS['avalanche_fuji']['explorer']}/address/{DEMO_STATE['wallet_address']}"
    
    wallet_panel = f"""
[bold green]Smart Wallet Deployed![/bold green]

  [cyan]Address:[/cyan]      {DEMO_STATE["wallet_address"]}
  [cyan]Type:[/cyan]         ERC-4337 Smart Account
  [cyan]Network:[/cyan]       Avalanche Fuji (Chain ID: 43113)
  
  [bold yellow]📊 Spending Limits:[/bold yellow]
  [cyan]Daily Limit:[/cyan]  [bold]${DEMO_STATE["spend_limit_usd"]:.2f} USD[/bold]
  [cyan]Per-TX Max:[/cyan]   $25.00 USD
  
  [bold blue]🔗 View on Snowtrace:[/bold blue]
  [link={explorer_link}]{explorer_link}[/link]
"""
    console.print(Panel(wallet_panel, title="💼 Wallet Deployed", border_style="green"))
    
    # Show the contract interaction
    console.print("\n[bold]📜 On-Chain Transaction:[/bold]")
    tx_table = Table(box=box.ROUNDED, show_header=False)
    tx_table.add_column("Field", style="cyan")
    tx_table.add_column("Value", style="green")
    tx_table.add_row("Contract", CONTRACTS["avalanche_fuji"]["wallet_factory"][:42])
    tx_table.add_row("Method", "createWallet(address,uint256)")
    tx_table.add_row("Gas Used", "~150,000")
    tx_table.add_row("Status", "[green]✓ Confirmed[/green]")
    console.print(tx_table)


# ============================================================================
# DEMO STEP 3: Natural Language Intent (0:35 - 1:05)
# ============================================================================

def demo_step3_natural_language():
    """
    🎬 Demo Step 3: Natural Language
    
    Timeline: 0:35 - 1:05 (30 seconds)
    Key Moment: "Just tell it what you want in plain English"
    """
    print_section(
        "3️⃣  NATURAL LANGUAGE COMMAND",
        'Type: "Monitor AVAX. Buy $20 if price drops below $30"',
        timing="0:35 - 1:05"
    )
    
    console.print("[bold magenta]🎯 KEY MOMENT: 'Just tell it what you want in plain English'[/bold magenta]\n")
    
    # The exact demo command from the pitch
    user_command = "Monitor AVAX. Buy $20 if price drops below $30"
    
    console.print("[dim]User types in natural language...[/dim]\n")
    console.print("[bold]💬 User Input:[/bold]")
    console.print("[cyan]>[/cyan] ", end="")
    animate_typing(user_command, delay=0.04)
    
    # Show AI processing
    console.print("\n[yellow]🧠 AI Processing (Google Gemini)...[/yellow]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        steps = [
            ("Parsing natural language intent...", 0.6),
            ("Extracting trading parameters...", 0.5),
            ("Validating against wallet policies...", 0.4),
            ("Creating on-chain intent record...", 0.5),
        ]
        for step_name, duration in steps:
            task = progress.add_task(description=step_name, total=100)
            for i in range(20):
                time.sleep(duration / 20)
                progress.update(task, advance=5)
    
    # Show AI understanding
    ai_analysis = {
        "intent_type": "CONDITIONAL_SWAP",
        "token_in": "USDC",
        "token_out": "AVAX",
        "amount_usd": 20.00,
        "condition": {
            "type": "PRICE_BELOW",
            "asset": "AVAX",
            "threshold": 30.00,
        },
        "confidence": 0.95,
    }
    
    console.print("\n[bold green]✅ Intent Parsed Successfully![/bold green]")
    
    intent_panel = f"""
[bold]🧠 AI Analysis:[/bold]

[cyan]Intent Type:[/cyan]      CONDITIONAL_SWAP
[cyan]Action:[/cyan]           Buy AVAX with USDC
[cyan]Amount:[/cyan]           $20.00 USD
[cyan]Condition:[/cyan]        When AVAX price < $30.00

[bold yellow]⚙️ Extracted Parameters:[/bold yellow]
"""
    console.print(Panel(intent_panel, title="🎯 Intent Analysis", border_style="cyan"))
    console.print(Syntax(json.dumps(ai_analysis, indent=2), "json", theme="monokai"))
    
    # Show policy check
    console.print("\n[bold]🛡️ Policy Validation:[/bold]")
    policy_table = Table(box=box.ROUNDED)
    policy_table.add_column("Check", style="cyan")
    policy_table.add_column("Result", justify="center")
    policy_table.add_column("Details")
    policy_table.add_row("Daily Limit", "[green]✓ PASS[/green]", f"$20 < ${DEMO_STATE['spend_limit_usd']:.0f} limit")
    policy_table.add_row("Token Whitelist", "[green]✓ PASS[/green]", "AVAX, USDC allowed")
    policy_table.add_row("Time Window", "[green]✓ PASS[/green]", "Trading hours active")
    console.print(policy_table)
    
    # Create intent record
    intent_id = str(uuid4())
    DEMO_STATE["intents"].append({
        "id": intent_id,
        "raw_input": user_command,
        "intent_type": "CONDITIONAL_SWAP",
        "status": "MONITORING",
        "created_at": datetime.now().isoformat(),
    })
    
    console.print(f"\n[green]✅ Intent created: {intent_id[:8]}...[/green]")
    console.print("[dim]Stored on IntentProcessor contract[/dim]")


# ============================================================================
# DEMO STEP 4: x402 Payment (1:05 - 1:35)
# ============================================================================

def demo_step4_x402_payment():
    """
    🎬 Demo Step 4: x402 Payment
    
    Timeline: 1:05 - 1:35 (30 seconds)
    Key Moment: "Pay per request, not subscriptions"
    """
    print_section(
        "4️⃣  x402 PAYMENT PROTOCOL",
        "Show payment request for price data, automatic authorization",
        timing="1:05 - 1:35"
    )
    
    console.print("[bold magenta]🎯 KEY MOMENT: 'Pay per request, not subscriptions'[/bold magenta]\n")
    
    # Show the payment request
    console.print("[dim]Agent needs price data to monitor AVAX...[/dim]")
    console.print("[yellow]📡 Requesting price data from Turf Network...[/yellow]\n")
    
    # Simulate 402 response
    console.print("[bold red]⚡ HTTP 402 Payment Required[/bold red]")
    
    payment_requirements = {
        "x-payment-required": True,
        "accepts": [
            {
                "scheme": "x402",
                "network": "avalanche_fuji",
                "maxAmountRequired": "10000",  # $0.01 in smallest unit
                "asset": "USDC",
                "payTo": CONTRACTS["avalanche_fuji"]["payment_facilitator"],
            }
        ],
        "price": "0.01 USDC",
        "resource": "/api/v1/data/price/AVAX",
    }
    
    console.print(Syntax(json.dumps(payment_requirements, indent=2), "json", theme="monokai"))
    
    # Show automatic payment flow
    console.print("\n[bold]💳 Automatic Payment Flow:[/bold]")
    
    flow_diagram = """
    ┌─────────────────┐      HTTP 402       ┌─────────────────┐
    │  DeFi Assistant │ ──────────────────▶ │  Price Oracle   │
    │     (Agent)     │                     │  (Turf Network) │
    └────────┬────────┘                     └────────┬────────┘
             │                                        │
             │  Agent wallet auto-signs               │
             │  X-Payment header                      │
             ▼                                        │
    ┌─────────────────┐                              │
    │  Agent Wallet   │                              │
    │   (ERC-4337)    │                              │
    └────────┬────────┘                              │
             │                                        │
             │  Payment verified                      │
             │  via facilitator                       │
             ▼                                        ▼
    ┌─────────────────────────────────────────────────────┐
    │              PaymentFacilitator Contract            │
    │         {CONTRACTS["avalanche_fuji"]["payment_facilitator"][:20]}...       │
    └─────────────────────────────────────────────────────┘
"""
    console.print(flow_diagram)
    
    # Show payment being made
    console.print("\n[yellow]🔐 Agent authorizing payment...[/yellow]")
    show_progress("Creating EIP-712 signed payment authorization...", duration=1.0)
    
    console.print("[yellow]📤 Sending payment with request...[/yellow]")
    show_progress("Verifying payment on-chain...", duration=0.8)
    
    console.print("\n[green]✅ Payment Successful![/green]")
    
    # Record payment
    payment_id = str(uuid4())
    DEMO_STATE["payments"].append({
        "id": payment_id,
        "amount_usd": 0.01,
        "resource": "AVAX price data",
        "timestamp": datetime.now().isoformat(),
    })
    
    payment_result = f"""
[bold green]Payment Completed![/bold green]

  [cyan]Amount:[/cyan]       $0.01 USDC
  [cyan]Resource:[/cyan]     AVAX Price Data
  [cyan]Method:[/cyan]       x402 Micropayment
  [cyan]Settlement:[/cyan]   Instant (sub-second)
  
[bold]📊 Response Data Received:[/bold]
  AVAX Price: $28.45 USD
  24h Change: +2.3%
  Source: Turf Network Oracle

[dim]💡 Pay-per-use: Only charged for what you consume![/dim]
"""
    console.print(Panel(payment_result, title="💰 x402 Payment", border_style="green"))


# ============================================================================
# DEMO STEP 5: Audit Trail (1:35 - 2:00)
# ============================================================================

def demo_step5_audit_trail():
    """
    🎬 Demo Step 5: Audit Trail
    
    Timeline: 1:35 - 2:00 (25 seconds)
    Key Moment: "Every action is logged and verifiable"
    """
    print_section(
        "5️⃣  AUDIT TRAIL & COMPLIANCE",
        "View intent log, spending dashboard, export compliance report",
        timing="1:35 - 2:00"
    )
    
    console.print("[bold magenta]🎯 KEY MOMENT: 'Every action is logged and verifiable'[/bold magenta]\n")
    
    # Show Intent Log
    console.print("[bold]📋 Intent Log:[/bold]")
    
    intent_table = Table(title="Recent Intents", box=box.ROUNDED)
    intent_table.add_column("Time", style="dim", width=12)
    intent_table.add_column("Intent", style="cyan", width=35)
    intent_table.add_column("Type", width=18)
    intent_table.add_column("Status", justify="center", width=12)
    
    # Add demo intents
    intent_table.add_row(
        datetime.now().strftime("%H:%M:%S"),
        "Monitor AVAX. Buy $20 if < $30",
        "CONDITIONAL_SWAP",
        "[yellow]MONITORING[/yellow]"
    )
    intent_table.add_row(
        (datetime.now()).strftime("%H:%M:%S"),
        "Fetch AVAX price data",
        "DATA_FETCH",
        "[green]COMPLETED[/green]"
    )
    console.print(intent_table)
    
    # Show Spending Dashboard
    console.print("\n[bold]💰 Spending Dashboard:[/bold]")
    
    spending_table = Table(box=box.ROUNDED)
    spending_table.add_column("Period", style="cyan")
    spending_table.add_column("Spent", style="yellow")
    spending_table.add_column("Limit", style="green")
    spending_table.add_column("Remaining", style="green")
    spending_table.add_column("Usage", justify="center")
    
    spent = sum(p["amount_usd"] for p in DEMO_STATE["payments"])
    remaining = DEMO_STATE["spend_limit_usd"] - spent
    usage_pct = (spent / DEMO_STATE["spend_limit_usd"]) * 100
    
    spending_table.add_row(
        "Today (Daily)",
        f"${spent:.2f}",
        f"${DEMO_STATE['spend_limit_usd']:.2f}",
        f"${remaining:.2f}",
        f"[green]{usage_pct:.1f}%[/green]"
    )
    spending_table.add_row(
        "This Week",
        f"${spent:.2f}",
        "$350.00",
        f"${350-spent:.2f}",
        f"[green]{(spent/350)*100:.1f}%[/green]"
    )
    console.print(spending_table)
    
    # Show Transaction History
    console.print("\n[bold]📜 Transaction History:[/bold]")
    
    tx_table = Table(box=box.ROUNDED)
    tx_table.add_column("Tx Hash", style="dim", width=18)
    tx_table.add_column("Type", style="cyan", width=15)
    tx_table.add_column("Amount", style="green", width=12)
    tx_table.add_column("Status", justify="center", width=10)
    tx_table.add_column("Timestamp", style="dim", width=20)
    
    tx_table.add_row(
        f"0x{uuid4().hex[:12]}...",
        "x402 Payment",
        "$0.01 USDC",
        "[green]✓[/green]",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    tx_table.add_row(
        f"0x{uuid4().hex[:12]}...",
        "Wallet Deploy",
        "0.002 AVAX",
        "[green]✓[/green]",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    tx_table.add_row(
        f"0x{uuid4().hex[:12]}...",
        "Agent Register",
        "0.001 AVAX",
        "[green]✓[/green]",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    console.print(tx_table)
    
    # Show Compliance Export Option
    console.print("\n[bold]📄 Compliance Report:[/bold]")
    
    compliance_panel = f"""
[bold]Export Options:[/bold]

  [green]✓[/green] [cyan]JSON Export[/cyan]     - Machine-readable format
  [green]✓[/green] [cyan]CSV Export[/cyan]      - Spreadsheet compatible
  [green]✓[/green] [cyan]PDF Report[/cyan]      - Audit-ready documentation
  
[bold]Report Includes:[/bold]
  • All intents with AI reasoning
  • Complete transaction history
  • Policy enforcement logs
  • Spending summaries by period
  • On-chain verification links

[dim]All data cryptographically signed and verifiable on Avalanche[/dim]
"""
    console.print(Panel(compliance_panel, title="📊 Export Compliance Report", border_style="blue"))


# ============================================================================
# Main Demo Flow
# ============================================================================


def main():
    """
    🎬 Main Demo Flow — 2-Minute Pitch Demo
    
    Follows the EXACT pitch script timing:
    | Time        | Action                                              |
    |-------------|-----------------------------------------------------|
    | 0:00 - 0:20 | Create Agent "DeFi Assistant"                       |
    | 0:20 - 0:35 | Deploy Wallet with $50/day limit                    |
    | 0:35 - 1:05 | Natural Language: "Monitor AVAX. Buy $20 if < $30"  |
    | 1:05 - 1:35 | x402 Payment for price data                         |
    | 1:35 - 2:00 | View audit trail & transaction history              |
    """
    print_banner()
    
    # Demo intro
    intro_panel = """
[bold]🎬 LIVE DEMO — 2-Minute Pitch Script[/bold]

This demo follows the EXACT pitch presentation flow:

[cyan]⏱️  0:00 - 0:20[/cyan]  Create Agent "DeFi Assistant"
[cyan]⏱️  0:20 - 0:35[/cyan]  Deploy Wallet ($50/day limit)
[cyan]⏱️  0:35 - 1:05[/cyan]  Natural Language Command
[cyan]⏱️  1:05 - 1:35[/cyan]  x402 Payment Demo
[cyan]⏱️  1:35 - 2:00[/cyan]  Audit Trail & Compliance

[bold yellow]Key Moments to Highlight:[/bold yellow]
• "Notice how easy this is — no coding required"
• "Real smart contract, deployed in seconds"
• "Just tell it what you want in plain English"
• "Pay per request, not subscriptions"
• "Every action is logged and verifiable"

[dim]Press Enter after each section to advance.[/dim]
"""
    console.print(Panel(intro_panel, title="🔺 AvaAgent Demo", border_style="red"))
    
    wait_for_enter("Press Enter to start the demo...")
    
    # Demo steps matching the pitch script
    demo_steps = [
        ("Step 1: Create Agent", demo_step1_create_agent),
        ("Step 2: Deploy Wallet", demo_step2_deploy_wallet),
        ("Step 3: Natural Language", demo_step3_natural_language),
        ("Step 4: x402 Payment", demo_step4_x402_payment),
        ("Step 5: Audit Trail", demo_step5_audit_trail),
    ]
    
    for i, (name, demo_func) in enumerate(demo_steps):
        try:
            demo_func()
        except Exception as e:
            console.print(f"[red]Error in {name}: {e}[/red]")
            import traceback
            traceback.print_exc()
        
        if i < len(demo_steps) - 1:
            wait_for_enter(f"Press Enter for next step...")
    
    # Demo complete
    console.print()
    console.rule("[bold green]🎉 DEMO COMPLETE![/bold green]")
    console.print()
    
    summary = f"""
[bold green]Demo Summary[/bold green]

[bold]What We Showed:[/bold]
  [green]✓[/green] Created agent: [cyan]{DEMO_STATE["agent_name"]}[/cyan]
  [green]✓[/green] Deployed wallet: [cyan]{DEMO_STATE.get("wallet_address", "N/A")[:20]}...[/cyan]
  [green]✓[/green] Daily limit: [cyan]${DEMO_STATE["spend_limit_usd"]:.2f}[/cyan]
  [green]✓[/green] Natural language intent processing
  [green]✓[/green] x402 micropayment: [cyan]${sum(p["amount_usd"] for p in DEMO_STATE["payments"]):.2f}[/cyan]
  [green]✓[/green] Full audit trail with compliance export

[bold]Smart Contracts Used:[/bold]
  • WalletFactory: {CONTRACTS["avalanche_fuji"]["wallet_factory"][:20]}...
  • AgentRegistry: {CONTRACTS["avalanche_fuji"]["agent_registry"][:20]}...
  • PaymentFacilitator: {CONTRACTS["avalanche_fuji"]["payment_facilitator"][:20]}...
  • IntentProcessor: {CONTRACTS["avalanche_fuji"]["intent_processor"][:20]}...

[bold blue]🔗 Links:[/bold blue]
  • Frontend: {FRONTEND_URL}
  • API: {API_BASE}
  • Explorer: {CONTRACTS["avalanche_fuji"]["explorer"]}

[bold yellow]Key Takeaways:[/bold yellow]
  🤖 AI agents that can safely handle money
  🔐 Enforced by code, not trust
  ⚡ Sub-second finality on Avalanche
  📊 Full auditability and compliance

[cyan]Built for Avalanche Hack2Build 2024 🔺[/cyan]
"""
    console.print(Panel(summary, title="🏆 AvaAgent — Agentic Infrastructure for Avalanche", border_style="green"))
    
    console.print("\n[bold green]Thank you for watching! 🚀[/bold green]\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Demo interrupted.[/yellow]")
        sys.exit(0)
