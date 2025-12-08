"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  Wallet,
  Activity,
  Settings,
  ExternalLink,
  Copy,
  Play,
  Pause,
  RefreshCw,
  Zap,
  Database,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  type: "trading" | "data" | "commerce" | "general";
  status: "active" | "paused" | "error";
  capabilities: string[];
  model: string;
  wallet_address?: string;
  network: string;
  created_at: string;
  updated_at: string;
  config: {
    daily_spending_limit: string;
    enable_staking: boolean;
    whitelisted_tokens: string[];
  };
  stats: {
    total_transactions: number;
    success_rate: number;
    total_volume: string;
    active_sessions: number;
    avg_response_time: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  status: "success" | "pending" | "failed";
  amount: string;
  token: string;
  hash: string;
  timestamp: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  status: "success" | "info" | "warning" | "error";
}

const agentTypeConfig = {
  trading: { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  data: { icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
  commerce: { icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  general: { icon: Bot, color: "text-zinc-500", bg: "bg-zinc-500/10" },
};

const statusConfig = {
  active: { label: "Active", variant: "success" as const, icon: CheckCircle },
  paused: { label: "Paused", variant: "secondary" as const, icon: Clock },
  error: { label: "Error", variant: "destructive" as const, icon: XCircle },
};

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ["agent", id],
    queryFn: () => api.get(`/api/v1/agents/${id}`),
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["agent", id, "transactions"],
    queryFn: () => api.get(`/api/v1/agents/${id}/transactions`),
    enabled: activeTab === "transactions",
  });

  const { data: activityLogs } = useQuery<ActivityLog[]>({
    queryKey: ["agent-activity", id],
    queryFn: () => api.get(`/api/v1/agents/${id}/activity`),
    enabled: activeTab === "activity",
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/v1/agents/${id}`, {
        status: agent?.status === "active" ? "paused" : "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
      toast({
        title: "Agent Updated",
        description: `Agent has been ${agent?.status === "active" ? "paused" : "activated"}.`,
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Bot className="h-16 w-16 text-zinc-300" />
        <h2 className="mt-4 text-xl font-semibold">Agent not found</h2>
        <Link href="/dashboard/agents" className="mt-4">
          <Button>Back to Agents</Button>
        </Link>
      </div>
    );
  }

  const typeConfig = agentTypeConfig[agent.type];
  const TypeIcon = typeConfig.icon;
  const status = statusConfig[agent.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className={`rounded-xl p-3 ${typeConfig.bg}`}>
            <TypeIcon className={`h-8 w-8 ${typeConfig.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">{agent.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toggleStatusMutation.mutate()}
            loading={toggleStatusMutation.isPending}
          >
            {agent.status === "active" ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button variant="gradient">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-avalanche-500" />
              <div>
                <p className="text-xs text-zinc-500">Transactions</p>
                <p className="text-xl font-bold">{agent.stats.total_transactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-zinc-500">Success Rate</p>
                <p className="text-xl font-bold">{agent.stats.success_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-zinc-500">Volume</p>
                <p className="text-xl font-bold">{agent.stats.total_volume}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-zinc-500">Active Sessions</p>
                <p className="text-xl font-bold">{agent.stats.active_sessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-zinc-500">Avg Response</p>
                <p className="text-xl font-bold">{agent.stats.avg_response_time}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Wallet Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agent.wallet_address ? (
                  <>
                    <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                      <code className="text-sm">
                        {agent.wallet_address.slice(0, 10)}...
                        {agent.wallet_address.slice(-8)}
                      </code>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(agent.wallet_address!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a
                            href={`https://testnet.snowtrace.io/address/${agent.wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Daily Limit</span>
                        <span className="font-medium">{agent.config.daily_spending_limit} AVAX</span>
                      </div>
                      <Progress value={35} className="h-2" />
                      <p className="text-xs text-zinc-500">35% of daily limit used</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.config.whitelisted_tokens.map((token) => (
                        <Badge key={token} variant="secondary">
                          {token}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Wallet className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">No wallet configured</p>
                    <Button variant="outline" className="mt-4">
                      Create Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} variant="outline" className="px-3 py-1.5">
                      {cap.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Model</span>
                    <span className="font-medium">{agent.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Network</span>
                    <Badge variant="kite">{agent.network}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Created</span>
                    <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent transactions executed by this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {transactions?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                    <Activity className="h-12 w-12 opacity-50" />
                    <p className="mt-2">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions?.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-lg border p-3 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "rounded-full p-2",
                              tx.status === "success"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : tx.status === "pending"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-red-500/10 text-red-500"
                            )}
                          >
                            {tx.status === "success" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : tx.status === "pending" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{tx.type}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(tx.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {tx.amount} {tx.token}
                          </p>
                          <a
                            href={`https://testnet.snowtrace.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-avalanche-500 hover:underline"
                          >
                            View tx
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Detailed log of agent actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {activityLogs?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                    <Clock className="h-12 w-12 opacity-50" />
                    <p className="mt-2">No activity recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs?.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 rounded-lg border p-3 dark:border-zinc-800"
                      >
                        <div
                          className={cn(
                            "mt-0.5 rounded-full p-1.5",
                            log.status === "success"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : log.status === "info"
                              ? "bg-blue-500/10 text-blue-500"
                              : log.status === "warning"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-red-500/10 text-red-500"
                          )}
                        >
                          {log.status === "success" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : log.status === "warning" ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : log.status === "error" ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <Activity className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-zinc-500">{log.details}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>Update your agent&apos;s settings and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input id="agent-name" defaultValue={agent.name} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4 dark:border-zinc-800">
                <div>
                  <p className="font-medium">Enable Staking</p>
                  <p className="text-sm text-zinc-500">Allow agent to stake tokens for rewards</p>
                </div>
                <Switch defaultChecked={agent.config.enable_staking} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spending-limit">Daily Spending Limit (AVAX)</Label>
                <Input
                  id="spending-limit"
                  type="number"
                  defaultValue={agent.config.daily_spending_limit}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button variant="gradient">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Agent</p>
                  <p className="text-sm text-zinc-500">
                    Permanently delete this agent and all its data
                  </p>
                </div>
                <Button variant="destructive">Delete Agent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
