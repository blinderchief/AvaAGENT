'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '100%']);

  return (
    <section ref={ref} id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-kite-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-kite-400 mb-4">
            How It Works
          </span>
          <h2 className="text-headline text-white mb-4">
            From Intent to
            <br />
            <span className="gradient-text-static">Execution</span>
          </h2>
          <p className="text-body-lg max-w-2xl mx-auto">
            A simple flow that turns your natural language commands 
            into secure on-chain transactions.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-white/10">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-avalanche-500 via-kite-500 to-avalanche-500"
            />
          </div>

          {/* Steps */}
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`relative flex items-center gap-8 mb-16 last:mb-0 ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Step Number */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10">
                <div className="w-16 h-16 rounded-2xl bg-background border border-white/10 flex items-center justify-center">
                  <span className="text-2xl font-bold gradient-text-static">{step.number}</span>
                </div>
              </div>

              {/* Content Card */}
              <div className={`ml-24 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16'}`}>
                <div className="glass-card p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} mb-4`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed mb-4">{step.description}</p>
                  
                  {/* Code/Example */}
                  <div className="rounded-lg bg-black/30 p-3 font-mono text-sm">
                    <span className="text-white/30">// </span>
                    <span className="text-avalanche-400">{step.example}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { MessageSquare, Brain, CheckCircle, Zap, FileCheck } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Speak Your Intent',
    description: 'Tell your agent what you want in plain English. No technical knowledge required.',
    example: '"Buy $20 AVAX if price drops below $30"',
    gradient: 'from-avalanche-500 to-avalanche-600',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Analyzes',
    description: 'Google Gemini parses your request and creates a structured, verifiable intent.',
    example: 'Intent: CONDITIONAL_SWAP → Validated',
    gradient: 'from-kite-500 to-kite-600',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Policy Check',
    description: 'Smart contracts verify the action against spending limits and permissions.',
    example: '$20 < $50/day limit ✓ APPROVED',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    number: '04',
    icon: Zap,
    title: 'Execute On-Chain',
    description: 'Your agent\'s wallet executes the transaction with sub-second Avalanche finality.',
    example: 'tx: 0x7a3f...executed in 0.8s',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    number: '05',
    icon: FileCheck,
    title: 'Log & Audit',
    description: 'Every action is recorded with full AI reasoning for compliance and debugging.',
    example: 'Intent #1247 → COMPLETED',
    gradient: 'from-purple-500 to-violet-500',
  },
];
