'use client';

import { motion } from 'framer-motion';

export function Partners() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-avalanche-500/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-white/40 uppercase tracking-widest text-sm mb-4">
            Powered by industry leaders
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Built on <span className="text-gradient">Proven Technology</span>
          </h2>
        </motion.div>

        {/* Scrolling logos */}
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 30,
                  ease: 'linear',
                },
              }}
              className="flex gap-16 pr-16"
            >
              {[...partners, ...partners].map((partner, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl glass-subtle hover:glass transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg ${partner.bgClass} flex items-center justify-center`}>
                    <span className="text-xl">{partner.icon}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-avalanche-400 transition-colors">
                      {partner.name}
                    </p>
                    <p className="text-white/40 text-sm">{partner.role}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const partners = [
  { name: 'Avalanche', role: 'Infrastructure', icon: '🔺', bgClass: 'bg-avalanche-500/20' },
  { name: 'Kite Network', role: 'AI L1', icon: '🪁', bgClass: 'bg-kite-500/20' },
  { name: 'Gemini AI', role: 'Intelligence', icon: '✨', bgClass: 'bg-purple-500/20' },
  { name: 'x402 Protocol', role: 'Payments', icon: '💳', bgClass: 'bg-green-500/20' },
  { name: 'Turf Network', role: 'Data', icon: '📊', bgClass: 'bg-blue-500/20' },
  { name: 'Reap Protocol', role: 'Commerce', icon: '🛒', bgClass: 'bg-orange-500/20' },
  { name: 'Chainlink', role: 'Oracles', icon: '🔗', bgClass: 'bg-cyan-500/20' },
  { name: 'OpenZeppelin', role: 'Security', icon: '🛡️', bgClass: 'bg-yellow-500/20' },
];

const stats = [
  { value: '4', label: 'Smart Contracts Deployed' },
  { value: '2', label: 'Networks Supported' },
  { value: '$0.001', label: 'Avg Transaction Cost' },
  { value: '<3s', label: 'Transaction Finality' },
];
