'use client';

import { useUser } from '@clerk/nextjs';
import {
  Bot,
  Wallet,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || 'Agent'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your agents today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Agents"
          value="3"
          change="+1 this week"
          trend="up"
          icon={Bot}
        />
        <StatCard
          title="Total Balance"
          value="$1,234.56"
          change="+12.5%"
          trend="up"
          icon={Wallet}
        />
        <StatCard
          title="Tasks Completed"
          value="127"
          change="+23 today"
          trend="up"
          icon={Activity}
        />
        <StatCard
          title="Success Rate"
          value="98.2%"
          change="-0.3%"
          trend="down"
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Active Agents</h2>
            <Link
              href="/dashboard/agents"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            <AgentCard
              name="Trading Bot Alpha"
              type="trading"
              status="active"
              tasks={45}
            />
            <AgentCard
              name="Data Analyzer"
              type="data"
              status="active"
              tasks={82}
            />
            <AgentCard
              name="Shopping Assistant"
              type="commerce"
              status="idle"
              tasks={0}
            />
          </div>
          <Link
            href="/dashboard/agents/new"
            className="mt-4 flex items-center justify-center space-x-2 w-full py-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Agent</span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            <ActivityItem
              title="Swap executed"
              description="0.5 AVAX → 10 USDC"
              time="2m ago"
              type="success"
            />
            <ActivityItem
              title="Price alert triggered"
              description="AVAX reached $40.00"
              time="15m ago"
              type="info"
            />
            <ActivityItem
              title="Data fetched"
              description="Market sentiment analysis"
              time="1h ago"
              type="success"
            />
            <ActivityItem
              title="Purchase completed"
              description="Amazon gift card - $25"
              time="2h ago"
              type="success"
            />
            <ActivityItem
              title="Agent paused"
              description="Trading Bot Beta - low balance"
              time="3h ago"
              type="warning"
            />
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="stat-card">
        <h2 className="text-lg font-semibold mb-6">Market Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <TokenPrice symbol="AVAX" price={38.42} change={2.3} />
          <TokenPrice symbol="ETH" price={2234.56} change={-1.2} />
          <TokenPrice symbol="BTC" price={43123.45} change={0.8} />
          <TokenPrice symbol="USDC" price={1.0} change={0} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="flex items-center mt-4 text-sm">
        {trend === 'up' ? (
          <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
        )}
        <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
          {change}
        </span>
      </div>
    </div>
  );
}

function AgentCard({
  name,
  type,
  status,
  tasks,
}: {
  name: string;
  type: string;
  status: string;
  tasks: number;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-avalanche-500 to-kite-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground capitalize">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {status}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{tasks} tasks</p>
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}) {
  const colors = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="flex items-start space-x-3">
      <div className={`w-2 h-2 mt-2 rounded-full ${colors[type]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  );
}

function TokenPrice({
  symbol,
  price,
  change,
}: {
  symbol: string;
  price: number;
  change: number;
}) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">{symbol}</p>
      <p className="text-lg font-semibold mt-1">
        ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
      <p
        className={`text-sm ${
          change > 0
            ? 'text-green-500'
            : change < 0
            ? 'text-red-500'
            : 'text-gray-500'
        }`}
      >
        {change > 0 ? '+' : ''}
        {change}%
      </p>
    </div>
  );
}
