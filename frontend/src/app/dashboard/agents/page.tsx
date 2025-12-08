"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Bot,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Settings,
  ExternalLink,
  Zap,
  Shield,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  description: string;
  type: "trading" | "data" | "commerce" | "general";
  status: "active" | "paused" | "error";
  capabilities: string[];
  wallet_address?: string;
  created_at: string;
  updated_at: string;
  stats: {
    total_transactions: number;
    success_rate: number;
    total_volume: string;
  };
}

const agentTypeConfig = {
  trading: { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  data: { icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
  commerce: { icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  general: { icon: Bot, color: "text-zinc-500", bg: "bg-zinc-500/10" },
};

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  paused: { label: "Paused", variant: "secondary" as const },
  error: { label: "Error", variant: "destructive" as const },
};

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: () => api.get("/api/v1/agents/"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (agent: Agent) =>
      api.patch(`/api/v1/agents/${agent.id}`, {
        status: agent.status === "active" ? "paused" : "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({
        title: "Agent Updated",
        description: "Agent status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update agent status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (agentId: string) => api.delete(`/api/v1/agents/${agentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Agent Deleted",
        description: "Agent has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete agent.",
        variant: "destructive",
      });
    },
  });

  const filteredAgents = agents?.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage your autonomous AI agents and their configurations
          </p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-avalanche-500/10 p-3">
                <Bot className="h-6 w-6 text-avalanche-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Agents</p>
                <p className="text-2xl font-bold">{agents?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <Play className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Active</p>
                <p className="text-2xl font-bold">
                  {agents?.filter((a) => a.status === "active").length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-500/10 p-3">
                <Pause className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Paused</p>
                <p className="text-2xl font-bold">
                  {agents?.filter((a) => a.status === "paused").length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-red-500/10 p-3">
                <Zap className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Errors</p>
                <p className="text-2xl font-bold">
                  {agents?.filter((a) => a.status === "error").length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredAgents?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bot className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
              <h3 className="mt-4 text-lg font-semibold">No agents found</h3>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by creating your first agent"}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/agents/new" className="mt-4">
                  <Button variant="gradient">Create Agent</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAgents?.map((agent) => {
            const typeConfig = agentTypeConfig[agent.type];
            const TypeIcon = typeConfig.icon;
            const status = statusConfig[agent.status];

            return (
              <Card key={agent.id} hover>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${typeConfig.bg}`}>
                        <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <Badge variant={status.variant} className="mt-1">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleStatusMutation.mutate(agent)}
                        >
                          {agent.status === "active" ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Agent
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Activate Agent
                            </>
                          )}
                        </DropdownMenuItem>
                        <Link href={`/dashboard/agents/${agent.id}`}>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                        </Link>
                        {agent.wallet_address && (
                          <DropdownMenuItem asChild>
                            <a
                              href={`https://testnet.snowtrace.io/address/${agent.wallet_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View on Explorer
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => handleDeleteClick(agent)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Agent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {agent.description}
                  </p>

                  {/* Capabilities */}
                  <div className="mb-4 flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Txns</p>
                      <p className="font-semibold">{agent.stats.total_transactions}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Success</p>
                      <p className="font-semibold">{agent.stats.success_rate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Volume</p>
                      <p className="font-semibold">{agent.stats.total_volume}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedAgent?.name}&rdquo;? This action
              cannot be undone and will permanently remove the agent and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedAgent && deleteMutation.mutate(selectedAgent.id)}
              loading={deleteMutation.isPending}
            >
              Delete Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
