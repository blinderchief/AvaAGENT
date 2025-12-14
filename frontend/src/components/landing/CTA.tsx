'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Github, FileText, MessageCircle } from 'lucide-react';

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-avalanche-950/10 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]">
          <div className="absolute inset-0 bg-avalanche-500/20 rounded-full blur-[150px] animate-pulse-slow" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main CTA Card */}
          <div className="relative rounded-3xl overflow-hidden">
            {/* Gradient Border */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-avalanche-500 via-kite-500 to-avalanche-500 rounded-3xl opacity-50" />
            
            <div className="relative glass-strong rounded-3xl p-12 md:p-16 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-avalanche-500 to-avalanche-600 mb-8 animate-pulse-glow"
              >
                <span className="text-4xl">🤖</span>
              </motion.div>

              {/* Heading */}
              <h2 className="text-headline text-white mb-4">
                Ready to Build Your
                <br />
                <span className="gradient-text">Autonomous Agent?</span>
              </h2>

              {/* Description */}
              <p className="text-body-lg max-w-xl mx-auto mb-10">
                Join the future of autonomous finance on Avalanche. 
                Deploy your first AI agent in minutes.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link href="/sign-up" className="btn-primary group w-full sm:w-auto">
                  <span className="flex items-center justify-center gap-2">
                    Start Building
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link href="/docs" className="btn-secondary w-full sm:w-auto">
                  <span className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" />
                    Read Docs
                  </span>
                </Link>
              </div>

              {/* Quick Links */}
              <div className="flex items-center justify-center gap-8">
                <a
                  href="https://github.com/avaagent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-medium">GitHub</span>
                </a>
                <a
                  href="https://discord.gg/avaagent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Discord</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
