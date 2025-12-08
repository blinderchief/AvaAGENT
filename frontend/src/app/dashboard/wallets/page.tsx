"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Wallet,
  MoreHorizontal,
  Send,
  ArrowDownToLine,
  Trash2,
  ExternalLink,
  Copy,
  Shield,
  Coins,
  TrendingUp,
  RefreshCw,
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WalletBalance {
  symbol: string;
  name: string;
  balance: string;
  value_usd: string;
  logo?: string;
}

interface AgentWallet {
  id: string;
  address: string;
  name: string;
  agent_id?: string;
  agent_name?: string;
  network: "avalanche" | "kite";
  type: "smart" | "eoa";
  balances: WalletBalance[];
  total_value_usd: string;
  daily_limit: string;
  daily_spent: string;
  created_at: string;
}

const networkConfig = {
  avalanche: {
    name: "Avalanche Fuji",
    explorer: "https://testnet.snowtrace.io",
    color: "text-avalanche-500",
    bg: "bg-avalanche-500/10",
  },
  kite: {
    name: "Kite Testnet",
    explorer: "https://explorer.gokite.ai",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
};

export default function WalletsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<AgentWallet | null>(null);
  const [sendForm, setSendForm] = useState({ to: "", amount: "", token: "AVAX" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallets, isLoading, refetch } = useQuery<AgentWallet[]>({
    queryKey: ["wallets"],
    queryFn: () => api.get("/api/v1/wallets/"),
  });

  const sendMutation = useMutation({
    mutationFn: (data: { wallet_id: string; to: string; amount: string; token: string }) =>
      api.post(`/api/v1/wallets/${data.wallet_id}/send`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setSendDialogOpen(false);
      setSendForm({ to: "", amount: "", token: "AVAX" });
      toast({
        title: "Transaction Sent",
        description: "Your transaction has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send transaction.",
        variant: "destructive",
      });
    },
  });

  const filteredWallets = wallets?.filter(
    (wallet) =>
      wallet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.agent_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = wallets?.reduce(
    (sum, w) => sum + parseFloat(w.total_value_usd.replace("$", "").replace(",", "")),
    0
  ) ?? 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  const handleSendClick = (wallet: AgentWallet) => {
    setSelectedWallet(wallet);
    setSendDialogOpen(true);
  };

  const handleSendSubmit = () => {
    if (!selectedWallet) return;
    sendMutation.mutate({
      wallet_id: selectedWallet.id,
      ...sendForm,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage agent wallets and track balances across networks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/dashboard/wallets/new">
            <Button variant="gradient" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Wallet
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search wallets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-avalanche-500/10 via-avalanche-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-avalanche-500/20 p-3">
                <Coins className="h-6 w-6 text-avalanche-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Wallets</p>
                <p className="text-2xl font-bold">{wallets?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <Shield className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Smart Wallets</p>
                <p className="text-2xl font-bold">
                  {wallets?.filter((w) => w.type === "smart").length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Networks</p>
                <p className="text-2xl font-bold">
                  {new Set(wallets?.map((w) => w.network)).size ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallets List */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredWallets?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
              <h3 className="mt-4 text-lg font-semibold">No wallets found</h3>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create a wallet to get started"}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/wallets/new" className="mt-4">
                  <Button variant="gradient">Create Wallet</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredWallets?.map((wallet) => {
            const network = networkConfig[wallet.network];
            const spentPercent =
              (parseFloat(wallet.daily_spent) / parseFloat(wallet.daily_limit)) * 100;

            return (
              <Card key={wallet.id} hover>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${network.bg}`}>
                        <Wallet className={`h-5 w-5 ${network.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{wallet.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {wallet.type === "smart" ? "Smart Wallet" : "EOA"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {network.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSendClick(wallet)}>
                          <Send className="mr-2 h-4 w-4" />
                          Send
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ArrowDownToLine className="mr-2 h-4 w-4" />
                          Receive
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={`${network.explorer}/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Explorer
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500 focus:text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Wallet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address */}
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                    <code className="text-xs text-zinc-600 dark:text-zinc-400">
                      {wallet.address.slice(0, 14)}...{wallet.address.slice(-10)}
                    </code>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(wallet.address)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Agent Link */}
                  {wallet.agent_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Linked Agent:</span>
                      <Link
                        href={`/dashboard/agents/${wallet.agent_id}`}
                        className="text-avalanche-500 hover:underline"
                      >
                        {wallet.agent_name}
                      </Link>
                    </div>
                  )}

                  {/* Balances */}
                  <div className="space-y-2">
                    {wallet.balances.slice(0, 3).map((balance) => (
                      <div
                        key={balance.symbol}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{balance.symbol}</span>
                        <div className="text-right">
                          <span>{balance.balance}</span>
                          <span className="ml-2 text-zinc-500">{balance.value_usd}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily Limit Progress */}
                  {wallet.type === "smart" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Daily Limit</span>
                        <span>
                          {wallet.daily_spent} / {wallet.daily_limit} AVAX
                        </span>
                      </div>
                      <Progress
                        value={spentPercent}
                        className="h-1.5"
                        indicatorClassName={cn(
                          spentPercent > 80 ? "bg-red-500" : spentPercent > 50 ? "bg-amber-500" : ""
                        )}
                      />
                    </div>
                  )}

                  {/* Total Value */}
                  <div className="flex items-center justify-between border-t pt-3 dark:border-zinc-800">
                    <span className="text-sm text-zinc-500">Total Value</span>
                    <span className="text-lg font-bold">{wallet.total_value_usd}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Tokens</DialogTitle>
            <DialogDescription>
              Send tokens from {selectedWallet?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="send-to">Recipient Address</Label>
              <Input
                id="send-to"
                placeholder="0x..."
                value={sendForm.to}
                onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="send-amount">Amount</Label>
                <Input
                  id="send-amount"
                  type="number"
                  placeholder="0.0"
                  value={sendForm.amount}
                  onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-token">Token</Label>
                <Input
                  id="send-token"
                  value={sendForm.token}
                  onChange={(e) => setSendForm({ ...sendForm, token: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSendSubmit}
              loading={sendMutation.isPending}
              disabled={!sendForm.to || !sendForm.amount}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
