#!/usr/bin/env python3
"""
AvaAgent Demo Script
====================

Interactive demo showcasing all features of the AvaAgent platform.
Run this script to demonstrate the application to judges.

Usage:
    cd scripts
    python demo.py

Requirements:
    - Backend running on http://localhost:8000
    - Frontend running on http://localhost:3000 (optional, for UI demo)
    - Python 3.11+ with requests, rich, web3 installed
"""

import asyncio
import json
import sys
import time
import os
from datetime import datetime
from typing import Optional

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
    ║         🔺 Agentic Infrastructure Platform for Avalanche 🔺        ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """
    console.print(banner, style="bold red")
    console.print()


def print_section(title: str, description: str = ""):
    """Print a section header."""
    console.print()
    console.rule(f"[bold cyan]{title}[/bold cyan]")
    if description:
        console.print(f"[dim]{description}[/dim]")
    console.print()


def wait_for_enter(message: str = "Press Enter to continue..."):
    """Wait for user input."""
    console.print(f"\n[yellow]{message}[/yellow]")
    input()


def check_service(url: str, name: str) -> bool:
    """Check if a service is running."""
    try:
        response = requests.get(url, timeout=5)
        return response.status_code in [200, 401, 403]
    except:
        return False


def demo_health_check():
    """Demo 1: Health Check & System Status."""
    print_section("1️⃣  System Health Check", "Verifying all services are operational")
    
    services = [
        (f"{API_BASE}/health", "Backend API"),
        (FRONTEND_URL, "Frontend (Next.js)"),
    ]
    
    table = Table(title="Service Status", box=box.ROUNDED)
    table.add_column("Service", style="cyan")
    table.add_column("URL", style="dim")
    table.add_column("Status", justify="center")
    
    all_healthy = True
    for url, name in services:
        is_healthy = check_service(url, name)
        status = "✅ Online" if is_healthy else "❌ Offline"
        status_style = "green" if is_healthy else "red"
        table.add_row(name, url, f"[{status_style}]{status}[/{status_style}]")
        if not is_healthy:
            all_healthy = False
    
    console.print(table)
    
    # Show health details if backend is up
    if check_service(f"{API_BASE}/health", "Backend"):
        try:
            response = requests.get(f"{API_BASE}/health")
            health_data = response.json()
            console.print("\n[bold]Backend Health Details:[/bold]")
            console.print(Panel(json.dumps(health_data, indent=2), title="Health Response", border_style="green"))
        except Exception as e:
            console.print(f"[yellow]Could not fetch health details: {e}[/yellow]")
    
    return all_healthy


def demo_deployed_contracts():
    """Demo 2: Show Deployed Smart Contracts."""
    print_section("2️⃣  Deployed Smart Contracts", "Live contracts on Avalanche Fuji & KiteAI Testnet")
    
    for network_name, network_data in CONTRACTS.items():
        console.print(f"\n[bold magenta]📋 {network_name.replace('_', ' ').title()} (Chain ID: {network_data['chain_id']})[/bold magenta]")
        
        table = Table(box=box.ROUNDED, show_header=True)
        table.add_column("Contract", style="cyan", width=25)
        table.add_column("Address", style="green", width=45)
        table.add_column("Explorer Link", style="blue")
        
        contracts = [
            ("WalletFactory", network_data["wallet_factory"]),
            ("AgentRegistry", network_data["agent_registry"]),
            ("PaymentFacilitator", network_data["payment_facilitator"]),
            ("IntentProcessor", network_data["intent_processor"]),
        ]
        
        for name, address in contracts:
            explorer_link = f"{network_data['explorer']}/address/{address}"
            table.add_row(name, address, f"[link={explorer_link}]View ↗[/link]")
        
        console.print(table)


def demo_create_agent():
    """Demo 3: Create an AI Agent."""
    print_section("3️⃣  Create AI Agent", "Demonstrating agent creation via API")
    
    agent_data = {
        "name": f"Demo Trading Agent {datetime.now().strftime('%H%M%S')}",
        "description": "Autonomous trading agent for DeFi operations on Avalanche",
        "type": "trading",
        "capabilities": ["swap_tokens", "monitor_prices", "execute_orders"],
        "config": {
            "autoStart": False,
            "maxTransactions": 100,
            "riskLevel": "medium",
            "notifications": True,
        }
    }
    
    console.print("[bold]Agent Configuration:[/bold]")
    console.print(Syntax(json.dumps(agent_data, indent=2), "json", theme="monokai"))
    
    console.print("\n[yellow]📤 Sending POST request to /api/v1/agents...[/yellow]")
    
    try:
        # Note: This would require authentication in production
        response = requests.post(
            f"{API_BASE}/agents",
            json=agent_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            console.print("\n[green]✅ Agent created successfully![/green]")
            console.print(Panel(json.dumps(result, indent=2, default=str), title="Created Agent", border_style="green"))
            return result.get("id")
        elif response.status_code == 401:
            console.print("\n[yellow]⚠️ Authentication required (expected in production)[/yellow]")
            console.print("[dim]In production, this endpoint requires Clerk JWT authentication[/dim]")
            # Show mock response
            mock_agent = {
                "id": "demo-agent-123",
                "name": agent_data["name"],
                "type": "trading",
                "status": "idle",
                "capabilities": agent_data["capabilities"],
                "created_at": datetime.now().isoformat()
            }
            console.print(Panel(json.dumps(mock_agent, indent=2), title="Expected Response", border_style="cyan"))
            return "demo-agent-123"
        else:
            console.print(f"\n[red]❌ Error: {response.status_code}[/red]")
            console.print(response.text)
    except requests.exceptions.ConnectionError:
        console.print("[red]❌ Backend not reachable. Please start the backend first.[/red]")
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
    
    return None


def demo_ai_chat():
    """Demo 4: AI Chat with Gemini Integration."""
    print_section("4️⃣  AI-Powered Chat", "Natural language interaction with Google Gemini")
    
    sample_prompts = [
        "What's the current price of AVAX?",
        "Help me swap 10 USDC for AVAX on Trader Joe",
        "Show me my agent's transaction history",
        "Create a DCA strategy for buying AVAX weekly",
    ]
    
    console.print("[bold]Sample AI Prompts:[/bold]")
    for i, prompt in enumerate(sample_prompts, 1):
        console.print(f"  {i}. [cyan]{prompt}[/cyan]")
    
    console.print("\n[yellow]📤 Simulating chat request...[/yellow]")
    
    chat_request = {
        "message": "What can you help me with?",
        "agent_id": "demo-agent-123",
        "context": {
            "network": "avalanche_fuji",
            "user_address": "0x97950A98980a2Fc61ea7eb043bb7666845f77071"
        }
    }
    
    console.print("\n[bold]Chat Request:[/bold]")
    console.print(Syntax(json.dumps(chat_request, indent=2), "json", theme="monokai"))
    
    try:
        response = requests.post(
            f"{API_BASE}/ai/chat",
            json=chat_request,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            console.print("\n[green]✅ AI Response received![/green]")
            console.print(Panel(result.get("response", result), title="AI Response", border_style="green"))
        elif response.status_code == 401:
            console.print("\n[yellow]⚠️ Authentication required[/yellow]")
            # Show expected response
            mock_response = {
                "response": "I'm AvaAgent, your autonomous AI assistant for Avalanche! I can help you with:\n\n"
                           "🔄 **Trading**: Swap tokens, monitor prices, execute DeFi strategies\n"
                           "💰 **Payments**: Send/receive tokens, manage x402 payments\n"
                           "📊 **Analytics**: Track portfolio, view transaction history\n"
                           "🤖 **Automation**: Set up recurring tasks, DCA strategies\n\n"
                           "What would you like to do?",
                "actions": [],
                "thinking": "User is asking about capabilities...",
            }
            console.print(Panel(json.dumps(mock_response, indent=2), title="Expected AI Response", border_style="cyan"))
        else:
            console.print(f"\n[yellow]Response: {response.status_code}[/yellow]")
    except requests.exceptions.ConnectionError:
        console.print("[yellow]Backend not reachable - showing expected behavior[/yellow]")
        mock_response = "I'm your AvaAgent assistant powered by Google Gemini!"
        console.print(Panel(mock_response, title="Expected Response", border_style="cyan"))
    except Exception as e:
        console.print(f"[yellow]Note: {e}[/yellow]")


def demo_x402_payments():
    """Demo 5: x402 Payment Protocol."""
    print_section("5️⃣  x402 Payment Protocol", "Machine-to-machine micropayments")
    
    console.print("[bold]x402 Payment Flow:[/bold]")
    
    flow_diagram = """
    ┌─────────────┐     HTTP 402      ┌─────────────┐
    │   Client    │ ──────────────▶  │   Server    │
    │  (Agent)    │                   │  (Service)  │
    └─────────────┘                   └─────────────┘
          │                                  │
          │  X-PAYMENT header               │
          │  (signed payment)               │
          ▼                                  ▼
    ┌─────────────┐                   ┌─────────────┐
    │  Thirdweb   │ ◀────────────────│ Facilitator │
    │   Wallet    │   Verify & Settle│  Contract   │
    └─────────────┘                   └─────────────┘
    """
    console.print(flow_diagram)
    
    payment_example = {
        "payer": "0x97950A98980a2Fc61ea7eb043bb7666845f77071",
        "recipient": "0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF",
        "amount": "10000",  # $0.01 USDC
        "token": "0x5425890298aed601595a70AB815c96711a31Bc65",  # Fuji USDC
        "resource_id": "ai-inference-001",
        "network": "avalanche_fuji",
    }
    
    console.print("\n[bold]Example Payment Request:[/bold]")
    console.print(Syntax(json.dumps(payment_example, indent=2), "json", theme="monokai"))
    
    console.print("\n[bold]Payment Tiers:[/bold]")
    tiers_table = Table(box=box.ROUNDED)
    tiers_table.add_column("Tier", style="cyan")
    tiers_table.add_column("Price", style="green")
    tiers_table.add_column("Use Case")
    tiers_table.add_row("Basic", "$0.01 USDC", "Standard AI inference")
    tiers_table.add_row("Premium", "$0.15 USDC", "Advanced features + priority")
    tiers_table.add_row("Enterprise", "$1.00 USDC", "Unlimited + dedicated support")
    console.print(tiers_table)


def demo_blockchain_integration():
    """Demo 6: Multi-chain Blockchain Integration."""
    print_section("6️⃣  Blockchain Integration", "Avalanche Fuji & KiteAI Testnet")
    
    console.print("[bold]Supported Networks:[/bold]\n")
    
    networks_table = Table(box=box.ROUNDED)
    networks_table.add_column("Network", style="cyan")
    networks_table.add_column("Chain ID", style="green")
    networks_table.add_column("RPC URL", style="dim")
    networks_table.add_column("Purpose")
    
    networks_table.add_row(
        "Avalanche Fuji",
        "43113",
        "https://api.avax-test.network/ext/bc/C/rpc",
        "Primary transactions & payments"
    )
    networks_table.add_row(
        "KiteAI Testnet",
        "2368",
        "https://rpc-testnet.gokite.ai",
        "AI inference verification"
    )
    
    console.print(networks_table)
    
    # Try to get blockchain data
    console.print("\n[yellow]📤 Fetching blockchain data...[/yellow]")
    
    try:
        from web3 import Web3
        
        # Connect to Avalanche Fuji
        w3 = Web3(Web3.HTTPProvider("https://api.avax-test.network/ext/bc/C/rpc"))
        
        if w3.is_connected():
            block = w3.eth.block_number
            gas_price = w3.eth.gas_price
            
            console.print(f"\n[green]✅ Connected to Avalanche Fuji![/green]")
            console.print(f"   Current Block: [cyan]{block:,}[/cyan]")
            console.print(f"   Gas Price: [cyan]{w3.from_wei(gas_price, 'gwei'):.2f} gwei[/cyan]")
            
            # Check contract deployment
            wallet_factory = CONTRACTS["avalanche_fuji"]["wallet_factory"]
            code = w3.eth.get_code(Web3.to_checksum_address(wallet_factory))
            if len(code) > 2:
                console.print(f"   WalletFactory: [green]✅ Deployed ({len(code)} bytes)[/green]")
            
        # Connect to Kite
        w3_kite = Web3(Web3.HTTPProvider("https://rpc-testnet.gokite.ai"))
        if w3_kite.is_connected():
            block_kite = w3_kite.eth.block_number
            console.print(f"\n[green]✅ Connected to KiteAI Testnet![/green]")
            console.print(f"   Current Block: [cyan]{block_kite:,}[/cyan]")
            
    except ImportError:
        console.print("[yellow]web3 not installed - skipping live blockchain check[/yellow]")
    except Exception as e:
        console.print(f"[yellow]Could not connect: {e}[/yellow]")


def demo_integrations():
    """Demo 7: External Integrations."""
    print_section("7️⃣  External Integrations", "Kite AI, Turf Network, Reap Protocol")
    
    integrations = [
        {
            "name": "🪁 Kite Blockchain",
            "description": "Decentralized AI inference and data verification",
            "features": ["AI model attestation", "Verifiable compute", "Data integrity proofs"],
            "api": "https://api.gokite.ai",
        },
        {
            "name": "🌐 Turf Network",
            "description": "Decentralized data orchestration",
            "features": ["Real-time data feeds", "Cross-source aggregation", "Price oracles"],
            "api": "https://api.turf.network",
        },
        {
            "name": "🛒 Reap Protocol",
            "description": "Autonomous e-commerce automation",
            "features": ["Product search", "Autonomous purchases", "Subscription management"],
            "api": "https://avax2.api.reap.deals",
        },
    ]
    
    for integration in integrations:
        panel_content = f"""
[bold]Description:[/bold] {integration['description']}

[bold]Features:[/bold]
{chr(10).join(f'  • {f}' for f in integration['features'])}

[bold]API:[/bold] {integration['api']}
"""
        console.print(Panel(panel_content, title=integration['name'], border_style="magenta"))


def demo_architecture():
    """Demo 8: System Architecture."""
    print_section("8️⃣  System Architecture", "Full-stack overview")
    
    architecture = """
┌─────────────────────────────────────────────────────────────────────┐
│                      [bold cyan]Frontend (Next.js 14)[/bold cyan]                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Dashboard  │ │   Agents   │ │  Wallets   │ │    Chat    │      │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘      │
│        └──────────────┴──────────────┴──────────────┘              │
│                              │                                      │
│                    ┌─────────▼─────────┐                           │
│                    │   [bold green]Clerk Auth[/bold green]       │                           │
│                    └─────────┬─────────┘                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                      [bold yellow]Backend (FastAPI)[/bold yellow]                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │   Agents   │ │  Wallets   │ │  Payments  │ │     AI     │      │
│  │  Service   │ │  Service   │ │   (x402)   │ │  (Gemini)  │      │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘      │
│        └──────────────┴──────────────┴──────────────┘              │
│                              │                                      │
│           ┌──────────────────┼──────────────────┐                  │
│           │        [bold red]Blockchain Service[/bold red]        │                  │
│           │  ┌─────────┐ ┌─────────┐ ┌─────────┐│                  │
│           │  │Avalanche│ │  Kite   │ │  Turf   ││                  │
│           │  └─────────┘ └─────────┘ └─────────┘│                  │
│           └─────────────────────────────────────┘                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                    [bold magenta]Smart Contracts (Foundry)[/bold magenta]                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │  AgentRegistry   │ │  WalletFactory   │ │PaymentFacilitator│   │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│  ┌──────────────────┐ ┌──────────────────┐                        │
│  │  AvaAgentWallet  │ │ IntentProcessor  │                        │
│  └──────────────────┘ └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
"""
    console.print(architecture)


def demo_tech_stack():
    """Demo 9: Technology Stack."""
    print_section("9️⃣  Technology Stack", "Production-ready technologies")
    
    stack_table = Table(title="Tech Stack", box=box.ROUNDED, show_header=True)
    stack_table.add_column("Layer", style="cyan", width=15)
    stack_table.add_column("Technology", style="green", width=20)
    stack_table.add_column("Version", style="yellow", width=10)
    stack_table.add_column("Purpose", width=35)
    
    stack = [
        ("Frontend", "Next.js", "14.1.0", "React framework with App Router"),
        ("Frontend", "TypeScript", "5.x", "Type-safe JavaScript"),
        ("Frontend", "Tailwind CSS", "3.x", "Utility-first CSS"),
        ("Frontend", "Clerk", "5.x", "Authentication"),
        ("Frontend", "Thirdweb", "5.x", "Web3 SDK & Account Abstraction"),
        ("Backend", "FastAPI", "0.109+", "High-performance Python API"),
        ("Backend", "SQLAlchemy", "2.0", "Async ORM"),
        ("Backend", "Neon PostgreSQL", "-", "Serverless database"),
        ("Backend", "Google Gemini", "1.5/2.0", "AI inference"),
        ("Blockchain", "Solidity", "0.8.24", "Smart contracts"),
        ("Blockchain", "Foundry", "1.5.0", "Development framework"),
        ("Blockchain", "OpenZeppelin", "5.5.0", "Security standards"),
    ]
    
    for layer, tech, version, purpose in stack:
        stack_table.add_row(layer, tech, version, purpose)
    
    console.print(stack_table)


def demo_features_summary():
    """Demo 10: Feature Summary."""
    print_section("🔟  Feature Summary", "All implemented features")
    
    features = {
        "🤖 Agent Management": [
            "Create and configure autonomous AI agents",
            "Define spending limits and capabilities",
            "Monitor agent performance and analytics",
            "Hierarchical identity (User → Agent → Session)",
        ],
        "💼 Smart Wallets": [
            "ERC-4337 compatible smart contract wallets",
            "Policy-based transaction controls",
            "Daily spending limits",
            "Token whitelisting for security",
        ],
        "💬 AI Chat Interface": [
            "Natural language interaction",
            "Real-time streaming responses",
            "Action execution with tracking",
            "Thinking process visibility",
        ],
        "💰 x402 Payments": [
            "Machine-to-machine micropayments",
            "Automatic payment negotiation",
            "USDC settlement on Avalanche",
            "Pay-per-use AI inference",
        ],
        "⛓️ Blockchain Integration": [
            "Multi-chain support (Fuji + Kite)",
            "Live contract deployment",
            "Transaction verification",
            "Gas-optimized operations",
        ],
    }
    
    for category, items in features.items():
        console.print(f"\n[bold magenta]{category}[/bold magenta]")
        for item in items:
            console.print(f"  [green]✓[/green] {item}")


def open_frontend():
    """Open the frontend in browser."""
    print_section("🌐 Open Frontend", "Launching the web application")
    
    import webbrowser
    console.print(f"[yellow]Opening {FRONTEND_URL} in your browser...[/yellow]")
    
    try:
        webbrowser.open(FRONTEND_URL)
        console.print("[green]✅ Browser opened![/green]")
    except Exception as e:
        console.print(f"[yellow]Could not open browser automatically: {e}[/yellow]")
        console.print(f"[cyan]Please open {FRONTEND_URL} manually[/cyan]")


def main():
    """Main demo flow."""
    print_banner()
    
    console.print(Panel(
        "[bold]Welcome to the AvaAgent Demo![/bold]\n\n"
        "This interactive demo will showcase all features of the AvaAgent platform - "
        "a production-ready agentic infrastructure for Avalanche.\n\n"
        "[dim]Press Enter after each section to continue.[/dim]",
        title="🎬 Demo Starting",
        border_style="cyan"
    ))
    
    wait_for_enter("Press Enter to begin the demo...")
    
    # Demo sections
    demos = [
        ("Health Check", demo_health_check),
        ("Deployed Contracts", demo_deployed_contracts),
        ("Create Agent", demo_create_agent),
        ("AI Chat", demo_ai_chat),
        ("x402 Payments", demo_x402_payments),
        ("Blockchain Integration", demo_blockchain_integration),
        ("External Integrations", demo_integrations),
        ("Architecture", demo_architecture),
        ("Tech Stack", demo_tech_stack),
        ("Features Summary", demo_features_summary),
    ]
    
    for i, (name, demo_func) in enumerate(demos):
        try:
            demo_func()
        except Exception as e:
            console.print(f"[red]Error in {name}: {e}[/red]")
        
        if i < len(demos) - 1:
            wait_for_enter()
    
    # Final summary
    console.print()
    console.rule("[bold green]Demo Complete![/bold green]")
    console.print()
    
    console.print(Panel(
        "[bold]Thank you for watching the AvaAgent demo![/bold]\n\n"
        "📌 [bold]Key Highlights:[/bold]\n"
        "  • Smart contracts deployed on Avalanche Fuji & KiteAI Testnet\n"
        "  • Full-stack application with Next.js + FastAPI\n"
        "  • AI-powered agents with Google Gemini integration\n"
        "  • x402 payment protocol for micropayments\n"
        "  • Multi-chain blockchain support\n\n"
        f"🔗 [bold]Links:[/bold]\n"
        f"  • Frontend: {FRONTEND_URL}\n"
        f"  • Backend API: {API_BASE}\n"
        f"  • Contracts: {CONTRACTS['avalanche_fuji']['explorer']}/address/{CONTRACTS['avalanche_fuji']['wallet_factory']}\n\n"
        "[cyan]Built for the Avalanche Hackathon 2024 🔺[/cyan]",
        title="🏆 AvaAgent - Agentic Infrastructure for Avalanche",
        border_style="green"
    ))
    
    # Ask to open frontend
    console.print("\n[yellow]Would you like to open the frontend? (y/n)[/yellow]")
    response = input().strip().lower()
    if response == 'y':
        open_frontend()
    
    console.print("\n[bold green]Thank you! 🚀[/bold green]\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Demo interrupted.[/yellow]")
        sys.exit(0)
