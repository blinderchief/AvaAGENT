'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function Contracts() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-emerald-400 mb-4">
            Live on Testnet
          </span>
          <h2 className="text-headline text-white mb-4">
            Deployed
            <span className="gradient-text-static"> Smart Contracts</span>
          </h2>
          <p className="text-body-lg max-w-2xl mx-auto">
            Verified and deployed on Avalanche Fuji. Click to view on Snowtrace.
          </p>
        </motion.div>

        {/* Networks */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {networks.map((network, networkIndex) => (
            <motion.div
              key={network.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: networkIndex * 0.1 }}
              className="glass-card p-6"
            >
              {/* Network Header */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div className="text-3xl">{network.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{network.name}</h3>
                  <p className="text-sm text-white/40">Chain ID: {network.chainId}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>

              {/* Contracts */}
              <div className="space-y-3">
                {network.contracts.map((contract, index) => (
                  <ContractRow
                    key={index}
                    name={contract.name}
                    address={contract.address}
                    explorer={network.explorer}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contract Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card p-8">
            <h4 className="text-lg font-bold text-white mb-6 text-center">
              Contract Architecture
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contractRoles.map((role, index) => (
                <div key={index} className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-3`}>
                    <span className="text-xl">{role.icon}</span>
                  </div>
                  <h5 className="font-semibold text-white text-sm mb-1">{role.name}</h5>
                  <p className="text-xs text-white/40">{role.role}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ContractRow({ 
  name, 
  address, 
  explorer 
}: { 
  name: string; 
  address: string; 
  explorer: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{name}</div>
        <div className="text-xs text-white/40 font-mono truncate">{shortAddress}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddress}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
          title="Copy address"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <a
          href={`${explorer}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
          title="View on explorer"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

const networks = [
  {
    name: 'Avalanche Fuji',
    icon: '🔺',
    chainId: '43113',
    explorer: 'https://testnet.snowtrace.io',
    contracts: [
      { name: 'WalletFactory', address: '0x849Ca487D5DeD85c93fc3600338a419B100833a8' },
      { name: 'AgentRegistry', address: '0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28' },
      { name: 'PaymentFacilitator', address: '0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF' },
      { name: 'IntentProcessor', address: '0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4' },
    ],
  },
  {
    name: 'Kite Testnet',
    icon: '🪁',
    chainId: '2368',
    explorer: 'https://testnet.kitescan.ai',
    contracts: [
      { name: 'WalletFactory', address: '0x849Ca487D5DeD85c93fc3600338a419B100833a8' },
      { name: 'AgentRegistry', address: '0xD26ae761DEBE79Ca423A370C0085D75b26Ecaf28' },
      { name: 'PaymentFacilitator', address: '0xD5932aF5c315C0A1fD9D486E0f58b7C210866ADF' },
      { name: 'IntentProcessor', address: '0x4B6171fA771fdA1F86445a5C06b0d5dA11875BC4' },
    ],
  },
];

const contractRoles = [
  {
    icon: '🏭',
    name: 'WalletFactory',
    role: 'Creates agent wallets',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '📋',
    name: 'AgentRegistry',
    role: 'Tracks all agents',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    icon: '💳',
    name: 'PaymentFacilitator',
    role: 'Handles x402 payments',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: '🎯',
    name: 'IntentProcessor',
    role: 'Executes intents',
    gradient: 'from-avalanche-500 to-rose-500',
  },
];
