'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Bot,
  Home,
  Wallet,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Commerce', href: '/dashboard/commerce', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, selectedNetwork, setSelectedNetwork } =
    useAppStore();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border border-border shadow-lg"
      >
        {sidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 px-6 py-5 border-b border-border hover:opacity-80 transition-opacity">
            <Image
              src="/logo.svg"
              alt="AvaAgent"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <span className="text-xl font-bold gradient-text">AvaAgent</span>
          </Link>

          {/* Network Selector */}
          <div className="px-4 py-4 border-b border-border">
            <label className="text-xs text-muted-foreground mb-2 block">
              Network
            </label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="avalanche_fuji">Avalanche Fuji</option>
              <option value="kite_testnet">Kite Testnet</option>
              <option value="avalanche">Avalanche C-Chain</option>
            </select>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="px-4 py-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Account</p>
                <p className="text-xs text-muted-foreground">Manage settings</p>
              </div>
            </div>
          </div>

          {/* Credit Balance */}
          <div className="px-4 py-4 border-t border-border">
            <div className="p-4 rounded-xl bg-gradient-to-br from-avalanche-500/10 to-kite-500/10 border border-avalanche-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Credits</span>
                <Zap className="w-4 h-4 text-avalanche-500" />
              </div>
              <p className="text-2xl font-bold">1,000</p>
              <p className="text-xs text-muted-foreground mt-1">
                ~$10.00 remaining
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
