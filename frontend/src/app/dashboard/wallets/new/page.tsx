"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Wallet, Shield, Key, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
}

interface CreateWalletForm {
  name: string;
  type: "smart" | "eoa";
  network: "avalanche" | "kite";
  agent_id?: string;
  config: {
    daily_spending_limit: string;
    require_2fa: boolean;
    whitelisted_addresses: string[];
  };
}

const walletTypes = [
  {
    id: "smart",
    name: "Smart Contract Wallet",
    description: "ERC-4337 account with spending limits, multi-sig support, and recovery options",
    icon: Shield,
    features: ["Spending Limits", "Gas Sponsorship", "Recovery", "Batch Transactions"],
    recommended: true,
  },
  {
    id: "eoa",
    name: "Standard Wallet (EOA)",
    description: "Traditional externally owned account with direct key control",
    icon: Key,
    features: ["Direct Control", "Lower Gas", "Simple Setup"],
    recommended: false,
  },
];

const networks = [
  {
    id: "avalanche",
    name: "Avalanche Fuji",
    description: "Avalanche C-Chain Testnet",
    chainId: 43113,
  },
  {
    id: "kite",
    name: "Kite Testnet",
    description: "Kite AI Network Testnet",
    chainId: 2368,
  },
];

export default function NewWalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateWalletForm>({
    name: "",
    type: "smart",
    network: "avalanche",
    config: {
      daily_spending_limit: "100",
      require_2fa: false,
      whitelisted_addresses: [],
    },
  });

  const [whitelistInput, setWhitelistInput] = useState("");

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["agents-list"],
    queryFn: () => api.get("/api/v1/agents/?status=all"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWalletForm) => api.post("/api/v1/wallets/", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast({
        title: "Wallet Created",
        description: "Your new wallet has been created successfully.",
      });
      router.push("/dashboard/wallets");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create wallet.",
        variant: "destructive",
      });
    },
  });

  const selectedWalletType = walletTypes.find((t) => t.id === form.type)!;

  const addWhitelistAddress = () => {
    if (whitelistInput && whitelistInput.startsWith("0x") && whitelistInput.length === 42) {
      setForm({
        ...form,
        config: {
          ...form.config,
          whitelisted_addresses: [...form.config.whitelisted_addresses, whitelistInput],
        },
      });
      setWhitelistInput("");
    }
  };

  const removeWhitelistAddress = (addr: string) => {
    setForm({
      ...form,
      config: {
        ...form.config,
        whitelisted_addresses: form.config.whitelisted_addresses.filter((a) => a !== addr),
      },
    });
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast({
        title: "Validation Error",
        description: "Please enter a wallet name.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/wallets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Wallet</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Deploy a new wallet for your agents
          </p>
        </div>
      </div>

      {/* Wallet Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-avalanche-500" />
            Wallet Type
          </CardTitle>
          <CardDescription>Choose the type of wallet to create</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {walletTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = form.type === type.id;

            return (
              <div
                key={type.id}
                onClick={() => setForm({ ...form, type: type.id as "smart" | "eoa" })}
                className={cn(
                  "cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md",
                  isSelected
                    ? "border-avalanche-500 bg-gradient-to-br from-avalanche-500/5 to-transparent"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      isSelected ? "bg-avalanche-500/10" : "bg-zinc-100 dark:bg-zinc-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isSelected ? "text-avalanche-500" : "text-zinc-500"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{type.name}</p>
                      {type.recommended && (
                        <Badge variant="avalanche" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{type.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {type.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-avalanche-500 text-white">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-avalanche-500" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Wallet Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Trading Wallet"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="network">Network *</Label>
            <Select
              value={form.network}
              onValueChange={(v) => setForm({ ...form, network: v as "avalanche" | "kite" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    <div className="flex items-center gap-2">
                      <span>{network.name}</span>
                      <span className="text-xs text-zinc-500">
                        (Chain ID: {network.chainId})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent">Link to Agent (Optional)</Label>
            <Select
              value={form.agent_id || "none"}
              onValueChange={(v) =>
                setForm({ ...form, agent_id: v === "none" ? undefined : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No agent</SelectItem>
                {agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              Optionally link this wallet to an agent for automated transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Smart Wallet Configuration */}
      {form.type === "smart" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Security Configuration
            </CardTitle>
            <CardDescription>Configure security settings for your smart wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="daily_limit">Daily Spending Limit (AVAX)</Label>
              <Input
                id="daily_limit"
                type="number"
                placeholder="100"
                value={form.config.daily_spending_limit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    config: { ...form.config, daily_spending_limit: e.target.value },
                  })
                }
              />
              <p className="text-xs text-zinc-500">
                Maximum amount that can be spent per day without additional approval
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4 dark:border-zinc-800">
              <div>
                <p className="font-medium">Require 2FA for Large Transactions</p>
                <p className="text-sm text-zinc-500">
                  Require additional verification for transactions above the daily limit
                </p>
              </div>
              <Switch
                checked={form.config.require_2fa}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    config: { ...form.config, require_2fa: checked },
                  })
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Whitelisted Addresses (Optional)</Label>
              <p className="text-xs text-zinc-500">
                Add addresses that can receive funds without additional checks
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="0x..."
                  value={whitelistInput}
                  onChange={(e) => setWhitelistInput(e.target.value)}
                />
                <Button variant="outline" onClick={addWhitelistAddress}>
                  Add
                </Button>
              </div>
              {form.config.whitelisted_addresses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.config.whitelisted_addresses.map((addr) => (
                    <Badge
                      key={addr}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeWhitelistAddress(addr)}
                    >
                      {addr.slice(0, 10)}...{addr.slice(-6)}
                      <span className="ml-1 text-red-500">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-gradient-to-br from-avalanche-500/5 to-transparent">
        <CardContent className="p-6">
          <p className="font-semibold text-avalanche-500">Wallet Summary</p>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name:</span>
              <span className="font-medium">{form.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Type:</span>
              <span className="font-medium">{selectedWalletType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Network:</span>
              <span className="font-medium">
                {networks.find((n) => n.id === form.network)?.name}
              </span>
            </div>
            {form.type === "smart" && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Daily Limit:</span>
                <span className="font-medium">{form.config.daily_spending_limit} AVAX</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Linked Agent:</span>
              <span className="font-medium">
                {form.agent_id
                  ? agents?.find((a) => a.id === form.agent_id)?.name
                  : "None"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Link href="/dashboard/wallets">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          variant="gradient"
          onClick={handleSubmit}
          loading={createMutation.isPending}
          disabled={!form.name}
        >
          Create Wallet
        </Button>
      </div>
    </div>
  );
}
