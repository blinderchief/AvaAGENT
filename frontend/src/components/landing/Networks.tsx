'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Layers, Cpu, Zap } from 'lucide-react';

export function Networks() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-avalanche-500/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle text-avalanche-400 text-sm font-medium mb-6">
            <Layers className="w-4 h-4" />
            Multi-Chain Architecture
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Deploy Across <span className="text-gradient">Avalanche Ecosystem</span>
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Seamlessly operate your agents across multiple Avalanche networks 
            with unified smart contract infrastructure
          </p>
        </motion.div>

        {/* Networks Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {networks.map((network, index) => (
            <motion.div
              key={network.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group relative"
            >
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${network.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
              
              <div className="relative h-full glass rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-all">
                {/* Network Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${network.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <span className="text-3xl">{network.icon}</span>
                </div>

                {/* Network Info */}
                <h3 className="text-2xl font-bold text-white mb-2">{network.name}</h3>
                <p className="text-white/50 mb-6 leading-relaxed">{network.description}</p>

                {/* Chain Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-white/40 text-sm">Chain ID</span>
                    <span className="text-white font-mono text-sm">{network.chainId}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-white/40 text-sm">Status</span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-400 text-sm">Active</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/40 text-sm">Native Token</span>
                    <span className="text-white font-medium text-sm">{network.token}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {network.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/60"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Link */}
                <a
                  href={network.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-avalanche-400 hover:text-avalanche-300 transition-colors text-sm"
                >
                  View Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Architecture Connection Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 glass rounded-3xl p-8 md:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">Unified Agent Infrastructure</h3>
            <p className="text-white/50">One agent, multiple chains, seamless interoperability</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            {/* Agent Core */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-avalanche-500 to-avalanche-600 flex items-center justify-center">
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Your Agent</p>
                <p className="text-white/40 text-sm">AI-Powered Core</p>
              </div>
            </div>

            {/* Connection Lines */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-12 h-px bg-gradient-to-r from-avalanche-500 to-transparent" />
              <Zap className="w-5 h-5 text-avalanche-500" />
              <div className="w-12 h-px bg-gradient-to-l from-avalanche-500 to-transparent" />
            </div>
            <div className="md:hidden w-px h-8 bg-gradient-to-b from-avalanche-500 to-transparent" />

            {/* Smart Contracts */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl glass border border-white/10 flex items-center justify-center">
                <Layers className="w-10 h-10 text-white/70" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Smart Contracts</p>
                <p className="text-white/40 text-sm">Cross-Chain Deployed</p>
              </div>
            </div>

            {/* Connection Lines */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-12 h-px bg-gradient-to-r from-white/20 to-transparent" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-12 h-px bg-gradient-to-l from-white/20 to-transparent" />
            </div>
            <div className="md:hidden w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />

            {/* Networks */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-avalanche-500/20 flex items-center justify-center text-xl">
                  🔺
                </div>
                <p className="text-white/40 text-xs">Fuji</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-kite-500/20 flex items-center justify-center text-xl">
                  🪁
                </div>
                <p className="text-white/40 text-xs">Kite</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl">
                  ⛓️
                </div>
                <p className="text-white/40 text-xs">L1s</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const networks = [
  {
    name: 'Avalanche Fuji',
    description: 'Primary testnet for development and testing. Full EVM compatibility with fast finality and low fees.',
    chainId: '43113',
    token: 'AVAX',
    icon: '🔺',
    gradient: 'from-avalanche-500/20 to-avalanche-600/20',
    explorerUrl: 'https://testnet.snowtrace.io',
    features: ['EVM Compatible', 'Fast Finality', 'Low Gas Fees'],
  },
  {
    name: 'Kite Network',
    description: 'AI-optimized L1 for agent operations, inference workloads, and intelligent automation.',
    chainId: '2368',
    token: 'KITE',
    icon: '🪁',
    gradient: 'from-kite-500/20 to-kite-600/20',
    explorerUrl: 'https://kite-explorer.example.com',
    features: ['AI-Optimized', 'High Throughput', 'Native Inference'],
  },
  {
    name: 'Custom Avalanche L1',
    description: 'Deploy on any Avalanche subnet or custom L1 with your own configuration and rules.',
    chainId: 'Custom',
    token: 'Custom',
    icon: '⛓️',
    gradient: 'from-purple-500/20 to-purple-600/20',
    explorerUrl: 'https://subnets.avax.network',
    features: ['Sovereign', 'Customizable', 'Interoperable'],
  },
];
