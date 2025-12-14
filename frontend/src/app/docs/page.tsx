'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Book,
  Code,
  Wallet,
  Bot,
  Zap,
  Shield,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Github,
  FileCode,
  Layers,
  Settings,
  Play,
  Database,
} from 'lucide-react';

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </Link>
              <div className="w-px h-6 bg-white/10" />
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.svg" alt="AvaAgent" width={32} height={32} />
                <span className="font-bold text-white">
                  Ava<span className="text-avalanche-500">Agent</span>
                </span>
              </Link>
            </div>
            <a
              href="https://github.com/blinderchief/AvaAGENT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24 space-y-2">
              {sidebarSections.map((section) => (
                <div key={section.title} className="mb-6">
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    {section.title}
                  </h4>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-4xl">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-avalanche-400 mb-6">
                <Book className="w-4 h-4" />
                Documentation
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                AvaAgent <span className="gradient-text-static">Documentation</span>
              </h1>
              <p className="text-xl text-white/60 leading-relaxed">
                Build autonomous AI agents with secure on-chain wallets. Deploy intelligent
                agents that can safely handle money on Avalanche.
              </p>
            </motion.div>

            {/* Quick Start */}
            <section id="quick-start" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Play className="w-6 h-6 text-avalanche-500" />
                Quick Start
              </h2>
              <div className="glass-card p-6 mb-6">
                <p className="text-white/70 mb-4">
                  Get started with AvaAgent in minutes. Follow these steps to deploy your first autonomous agent.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-avalanche-500/20 flex items-center justify-center text-avalanche-400 font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Clone the Repository</h4>
                      <CodeBlock
                        code="git clone https://github.com/blinderchief/AvaAGENT.git"
                        id="clone"
                        onCopy={copyCode}
                        copied={copiedCode === 'clone'}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-avalanche-500/20 flex items-center justify-center text-avalanche-400 font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Install Dependencies</h4>
                      <CodeBlock
                        code="cd AvaAGENT && npm install"
                        id="install"
                        onCopy={copyCode}
                        copied={copiedCode === 'install'}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-avalanche-500/20 flex items-center justify-center text-avalanche-400 font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Configure Environment</h4>
                      <CodeBlock
                        code="cp .env.example .env && nano .env"
                        id="config"
                        onCopy={copyCode}
                        copied={copiedCode === 'config'}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-avalanche-500/20 flex items-center justify-center text-avalanche-400 font-bold text-sm shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Start Development Server</h4>
                      <CodeBlock
                        code="docker-compose up -d"
                        id="start"
                        onCopy={copyCode}
                        copied={copiedCode === 'start'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Layers className="w-6 h-6 text-kite-500" />
                Architecture
              </h2>
              <div className="glass-card p-6">
                <p className="text-white/70 mb-6">
                  AvaAgent is built with a modular architecture designed for security and scalability.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {architectureComponents.map((component, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${component.gradient} flex items-center justify-center mb-3`}>
                        <component.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-white mb-1">{component.name}</h4>
                      <p className="text-sm text-white/50">{component.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Smart Contracts */}
            <section id="smart-contracts" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FileCode className="w-6 h-6 text-emerald-500" />
                Smart Contracts
              </h2>
              <div className="glass-card p-6">
                <p className="text-white/70 mb-6">
                  Our smart contracts are deployed on Avalanche Fuji and Kite Testnet.
                </p>
                <div className="space-y-4">
                  {contracts.map((contract, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{contract.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                          Verified
                        </span>
                      </div>
                      <p className="text-sm text-white/50 mb-3">{contract.description}</p>
                      <div className="font-mono text-xs text-white/40 bg-black/30 px-3 py-2 rounded">
                        {contract.address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Agent Wallets */}
            <section id="wallets" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Wallet className="w-6 h-6 text-blue-500" />
                Agent Wallets
              </h2>
              <div className="glass-card p-6">
                <p className="text-white/70 mb-6">
                  AvaAgent uses ERC-4337 Account Abstraction for smart wallet functionality.
                  Each agent gets its own wallet with programmable spending limits.
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="font-semibold text-white mb-2">Key Features</h4>
                    <ul className="space-y-2 text-sm text-white/60">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Programmable spending limits (daily, per-transaction)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Allowlisted addresses for transfers
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Gas abstraction for seamless UX
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Multi-sig support for high-value operations
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Integration */}
            <section id="ai-integration" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Bot className="w-6 h-6 text-purple-500" />
                AI Integration
              </h2>
              <div className="glass-card p-6">
                <p className="text-white/70 mb-6">
                  AvaAgent integrates with Google Gemini for natural language processing
                  and intent understanding.
                </p>
                <CodeBlock
                  code={`// Example: Process user intent
const response = await agent.processIntent({
  message: "Buy $20 AVAX if price drops below $30",
  userId: "user_123",
  walletId: "wallet_456"
});

// Response includes structured intent
{
  action: "CONDITIONAL_SWAP",
  params: {
    amount: 20,
    token: "AVAX",
    condition: "price < 30"
  },
  approved: true
}`}
                  id="ai-example"
                  onCopy={copyCode}
                  copied={copiedCode === 'ai-example'}
                  language="typescript"
                />
              </div>
            </section>

            {/* x402 Payments */}
            <section id="x402-payments" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-500" />
                x402 Micropayments
              </h2>
              <div className="glass-card p-6">
                <p className="text-white/70 mb-6">
                  x402 is our implementation of HTTP 402 Payment Required for micropayments.
                  Pay-per-use model where agents only pay for what they consume.
                </p>
                <div className="p-4 rounded-lg bg-white/5 mb-4">
                  <h4 className="font-semibold text-white mb-2">How it Works</h4>
                  <ol className="space-y-2 text-sm text-white/60 list-decimal list-inside">
                    <li>Agent requests a paid resource</li>
                    <li>Server returns HTTP 402 with payment details</li>
                    <li>Agent wallet signs payment authorization</li>
                    <li>Resource is delivered after payment verification</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Security */}
            <section id="security" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-cyan-500" />
                Security
              </h2>
              <div className="glass-card p-6">
                <p className="text-white/70 mb-6">
                  Security is at the core of AvaAgent. All agent actions are constrained
                  by smart contract rules that cannot be bypassed.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {securityFeatures.map((feature, index) => (
                    <div key={index} className="p-4 rounded-lg bg-white/5">
                      <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                      <p className="text-sm text-white/50">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Terminal className="w-6 h-6 text-rose-500" />
                API Reference
              </h2>
              <div className="glass-card p-6">
                <p className="text-white/70 mb-6">
                  The AvaAgent API provides RESTful endpoints for managing agents, wallets, and intents.
                </p>
                <div className="space-y-4">
                  {apiEndpoints.map((endpoint, index) => (
                    <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${endpoint.methodColor}`}>
                          {endpoint.method}
                        </span>
                        <code className="text-white font-mono text-sm">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-white/50">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Support */}
            <section id="support" className="mb-16">
              <div className="glass-card p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
                <p className="text-white/60 mb-6">
                  Join our community or check out the GitHub repository for more information.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <a
                    href="https://github.com/blinderchief/AvaAGENT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary !py-3 !px-6"
                  >
                    <span className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      View on GitHub
                    </span>
                  </a>
                  <a
                    href="https://discord.gg/avaagent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary !py-3 !px-6"
                  >
                    Join Discord
                  </a>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({
  code,
  id,
  onCopy,
  copied,
  language = 'bash',
}: {
  code: string;
  id: string;
  onCopy: (code: string, id: string) => void;
  copied: boolean;
  language?: string;
}) {
  return (
    <div className="relative group">
      <pre className="bg-black/50 rounded-lg p-4 font-mono text-sm text-white/80 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => onCopy(code, id)}
        className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4 text-white/60" />
        )}
      </button>
    </div>
  );
}

const sidebarSections = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Quick Start', href: '#quick-start', icon: Play },
      { label: 'Architecture', href: '#architecture', icon: Layers },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { label: 'Smart Contracts', href: '#smart-contracts', icon: FileCode },
      { label: 'Agent Wallets', href: '#wallets', icon: Wallet },
      { label: 'AI Integration', href: '#ai-integration', icon: Bot },
      { label: 'x402 Payments', href: '#x402-payments', icon: Zap },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'Security', href: '#security', icon: Shield },
      { label: 'API Reference', href: '#api-reference', icon: Terminal },
    ],
  },
];

const architectureComponents = [
  {
    name: 'Frontend (Next.js)',
    description: 'React-based dashboard for managing agents and wallets',
    icon: Code,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Backend (FastAPI)',
    description: 'Python API handling AI processing and blockchain interactions',
    icon: Terminal,
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    name: 'Smart Contracts (Solidity)',
    description: 'ERC-4337 wallets, registry, and payment facilitator',
    icon: FileCode,
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    name: 'Database (PostgreSQL)',
    description: 'Stores agent configs, intents, and audit logs',
    icon: Database,
    gradient: 'from-amber-500 to-orange-500',
  },
];

const contracts = [
  {
    name: 'WalletFactory',
    description: 'Creates and deploys new agent wallets with customizable policies',
    address: '0x849Ca487D5DeD85c93fc3600338a419B100833a8',
  },
  {
    name: 'AgentRegistry',
    description: 'Tracks all registered agents and their associated wallets',
    address: '0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28',
  },
  {
    name: 'PaymentFacilitator',
    description: 'Handles x402 micropayments and payment verification',
    address: '0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF',
  },
  {
    name: 'IntentProcessor',
    description: 'Processes and executes verified agent intents on-chain',
    address: '0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4',
  },
];

const securityFeatures = [
  {
    title: 'Spending Limits',
    description: 'Hard-coded daily and per-transaction limits enforced by smart contracts',
  },
  {
    title: 'Address Allowlists',
    description: 'Agents can only interact with pre-approved addresses',
  },
  {
    title: 'Intent Verification',
    description: 'All actions are verified against policy rules before execution',
  },
  {
    title: 'Full Audit Trail',
    description: 'Every action is logged with timestamps and AI reasoning',
  },
];

const apiEndpoints = [
  {
    method: 'POST',
    path: '/api/v1/agents',
    description: 'Create a new AI agent with custom configuration',
    methodColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    method: 'GET',
    path: '/api/v1/agents/{id}',
    description: 'Retrieve agent details and current status',
    methodColor: 'bg-blue-500/20 text-blue-400',
  },
  {
    method: 'POST',
    path: '/api/v1/intents',
    description: 'Submit a new intent for AI processing',
    methodColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    method: 'GET',
    path: '/api/v1/wallets/{id}/balance',
    description: 'Get wallet balance and transaction history',
    methodColor: 'bg-blue-500/20 text-blue-400',
  },
  {
    method: 'POST',
    path: '/api/v1/payments/x402',
    description: 'Process an x402 micropayment',
    methodColor: 'bg-emerald-500/20 text-emerald-400',
  },
];
