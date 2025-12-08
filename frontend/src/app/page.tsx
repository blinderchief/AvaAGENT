import Link from 'next/link';
import { ArrowRight, Bot, Zap, Shield, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-gray-50 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-avalanche-500 to-kite-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">AvaAgent</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-avalanche-500/10 border border-avalanche-500/20 text-avalanche-600 dark:text-avalanche-400 text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Built for Avalanche Hack2Build Hackathon</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              The <span className="gradient-text">Agentic OS</span>
              <br />
              for Avalanche
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Deploy autonomous AI agents that trade, analyze, and transact across 
              Avalanche L1s. Powered by x402 payments, Kite network, and Gemini AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/sign-up"
                className="btn-primary inline-flex items-center space-x-2 text-lg"
              >
                <span>Launch Your Agent</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#demo"
                className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center space-x-2"
              >
                <span>Watch Demo</span>
              </Link>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-avalanche-500/20 via-kite-500/20 to-avalanche-500/20 blur-3xl opacity-50 animate-gradient-x" />
            <div className="relative bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-gray-400">AvaAgent Dashboard</span>
              </div>
              <div className="p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-avalanche-500 to-kite-500 flex items-center justify-center animate-float">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-400">
                    Your autonomous agent dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Powerful Agent Infrastructure
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build, deploy, and manage autonomous AI agents on Avalanche.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="stat-card hover:shadow-xl transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Networks Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Multi-Chain by Design
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Deploy agents across Avalanche C-Chain, Kite Network, and custom L1s.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {networks.map((network, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
                  <span className="text-2xl">{network.icon}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{network.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{network.description}</p>
                <div className="text-xs text-muted-foreground">
                  Chain ID: {network.chainId}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-avalanche-600 to-kite-600" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative px-8 py-16 md:px-16 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Build Your Agent?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Join the future of autonomous finance on Avalanche. 
                Deploy your first AI agent in minutes.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center space-x-2 bg-white text-gray-900 font-medium px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span>Start Building</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-avalanche-500 to-kite-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">AvaAgent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Avalanche Hack2Build 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: 'AI-Powered Agents',
    description: 'Autonomous agents powered by Gemini AI that can analyze markets, execute trades, and make decisions.',
    icon: Bot,
    gradient: 'from-avalanche-500 to-avalanche-600',
  },
  {
    title: 'x402 Micropayments',
    description: 'Pay-per-use model with HTTP 402 payment protocol. Only pay for what your agents consume.',
    icon: Zap,
    gradient: 'from-kite-500 to-kite-600',
  },
  {
    title: 'Smart Wallets',
    description: 'ERC-4337 account abstraction with spending limits, operators, and batch transactions.',
    icon: Shield,
    gradient: 'from-green-500 to-green-600',
  },
  {
    title: 'Multi-Chain Support',
    description: 'Deploy on Avalanche C-Chain, Kite Network, and custom L1s seamlessly.',
    icon: Globe,
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Real-World Commerce',
    description: 'Purchase physical products with crypto through Reap Protocol integration.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        <path d="M20 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    title: 'Data Orchestration',
    description: 'Access real-time market data, sentiment analysis, and on-chain metrics via Turf Network.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-cyan-600',
  },
];

const networks = [
  {
    name: 'Avalanche C-Chain',
    description: 'Main EVM-compatible chain for DeFi and smart contracts.',
    chainId: '43113 (Fuji)',
    icon: '🔺',
  },
  {
    name: 'Kite Network',
    description: 'AI-optimized L1 for agent operations and inference.',
    chainId: '2368',
    icon: '🪁',
  },
  {
    name: 'Custom L1s',
    description: 'Deploy on any Avalanche subnet or L1 network.',
    chainId: 'Custom',
    icon: '⛓️',
  },
];
