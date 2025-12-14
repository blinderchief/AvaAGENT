'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Twitter, Github, MessageCircle, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative pt-24 pb-12 border-t border-white/5">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-avalanche-500/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Image
                src="/logo.svg"
                alt="AvaAgent"
                width={40}
                height={40}
              />
              <span className="text-xl font-bold text-white">
                Ava<span className="text-avalanche-500">Agent</span>
              </span>
            </Link>
            <p className="text-white/50 max-w-sm mb-6 leading-relaxed">
              The future of AI-powered commerce on Avalanche. Natural language payments, 
              autonomous agents, and seamless blockchain integration.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all hover:scale-110"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h4 className="text-white font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      {link.external && <ExternalLink className="w-3 h-3" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2025 AvaAgent. Built on Avalanche.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-white/40 hover:text-white/70 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-white/40 hover:text-white/70 text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Powered by Avalanche */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <div className="glass-subtle px-6 py-3 rounded-full flex items-center gap-3">
            <span className="text-white/40 text-sm">Powered by</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-avalanche-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-white font-medium">Avalanche</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

const socialLinks = [
  { label: 'Twitter', href: 'https://twitter.com/avaagent', icon: Twitter },
  { label: 'GitHub', href: 'https://github.com/avaagent', icon: Github },
  { label: 'Discord', href: 'https://discord.gg/avaagent', icon: MessageCircle },
];

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'API', href: '/api' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'SDK Guide', href: '/docs/sdk' },
      { label: 'Contracts', href: '#contracts', external: true },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Press Kit', href: '/press' },
    ],
  },
];
