"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function AnalyticsPage() {
  // Mock data - in production would come from API
  const stats = {
    totalTransactions: 1247,
    totalVolume: "$45,678.90",
    successRate: 98.5,
    activeAgents: 12,
    weeklyGrowth: 15.3,
    gasSpent: "2.45 AVAX",
  };

  const recentActivity = [
    { id: 1, type: "swap", agent: "Trading Bot Alpha", amount: "$1,234.56", status: "success", time: "2 min ago" },
    { id: 2, type: "transfer", agent: "DeFi Manager", amount: "$890.00", status: "success", time: "5 min ago" },
    { id: 3, type: "stake", agent: "Yield Farmer", amount: "$5,000.00", status: "pending", time: "12 min ago" },
    { id: 4, type: "swap", agent: "Trading Bot Alpha", amount: "$456.78", status: "success", time: "1 hour ago" },
    { id: 5, type: "purchase", agent: "Commerce Agent", amount: "$99.99", status: "success", time: "2 hours ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Monitor your agents&apos; performance and transaction metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-avalanche-500/10 p-3">
                <Activity className="h-6 w-6 text-avalanche-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
              <span>{stats.weeklyGrowth}% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Volume</p>
                <p className="text-2xl font-bold">{stats.totalVolume}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-emerald-500">
              <TrendingUp className="h-4 w-4" />
              <span>Growing steadily</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-zinc-500">
              <span>Last 30 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Active Agents</p>
                <p className="text-2xl font-bold">{stats.activeAgents}</p>
              </div>
              <div className="rounded-lg bg-kite-500/10 p-3">
                <Activity className="h-6 w-6 text-kite-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Gas Spent</p>
                <p className="text-2xl font-bold">{stats.gasSpent}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <DollarSign className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-red-500">
              <ArrowDownRight className="h-4 w-4" />
              <span>Optimized by 12%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions from your agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</p>
                    <p className="text-sm text-zinc-500">{activity.agent}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{activity.amount}</p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant={activity.status === "success" ? "success" : "secondary"}>
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
          <CardDescription>Daily transaction volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-500">Charts coming soon</p>
              <p className="text-xs text-zinc-400">Connect your agents to see analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
