'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Bot, 
  Wallet, 
  Zap, 
  Shield, 
  Brain, 
  BarChart3,
  ArrowUpRight,
  Cpu
} from 'lucide-react';

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-avalanche-950/5 to-background" />
      
      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-avalanche-400 mb-4">
            Core Features
          </span>
          <h2 className="text-headline text-white mb-4">
            Everything You Need for
            <br />
            <span className="gradient-text-static">Autonomous Finance</span>
          </h2>
          <p className="text-body-lg max-w-2xl mx-auto">
            A complete infrastructure for building, deploying, and managing 
            AI agents that can safely handle money.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`feature-card group ${feature.span || ''}`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
              }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-avalanche-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-white/50 leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {feature.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-white/5 text-white/40 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Hover Arrow */}
              <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-avalanche-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-white/40 mb-4">
            Ready to build the future of autonomous finance?
          </p>
          <a
            href="/docs"
            className="inline-flex items-center gap-2 text-avalanche-400 font-medium hover:text-avalanche-300 transition-colors"
          >
            Read the Documentation
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Agents',
    description: 'Autonomous agents powered by Google Gemini that can analyze markets, execute trades, and make decisions in real-time.',
    tags: ['Gemini AI', 'Natural Language', 'Auto-Trading'],
    gradient: 'from-avalanche-500 to-avalanche-600',
    span: 'lg:col-span-2',
  },
  {
    icon: Wallet,
    title: 'Smart Wallets',
    description: 'ERC-4337 account abstraction with programmable spending limits and policy enforcement.',
    tags: ['ERC-4337', 'Spending Limits'],
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Zap,
    title: 'x402 Micropayments',
    description: 'Pay-per-use model with HTTP 402 protocol. Only pay for what your agents consume.',
    tags: ['HTTP 402', 'Pay-per-use'],
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Rules enforced by code, not trust. Agents literally cannot exceed their programmed limits.',
    tags: ['Guardrails', 'Policy Engine', 'Audit Trail'],
    gradient: 'from-cyan-500 to-blue-500',
    span: 'lg:col-span-2',
  },
  {
    icon: Brain,
    title: 'Intent Processing',
    description: 'Natural language to on-chain execution. Just tell your agent what to do.',
    tags: ['NLP', 'Intent Engine'],
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    icon: Cpu,
    title: 'Multi-Chain',
    description: 'Deploy on Avalanche C-Chain, Kite Network, and custom L1s seamlessly.',
    tags: ['Avalanche', 'Kite AI', 'Cross-chain'],
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Full Auditability',
    description: 'Every intent logged with AI reasoning. Compliance-ready and debugging-friendly.',
    tags: ['Compliance', 'Analytics', 'Logging'],
    gradient: 'from-kite-500 to-kite-600',
  },
];
