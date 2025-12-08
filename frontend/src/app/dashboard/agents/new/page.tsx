"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  Zap,
  Database,
  Shield,
  Sparkles,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreateAgentForm {
  name: string;
  description: string;
  type: "trading" | "data" | "commerce" | "general";
  capabilities: string[];
  model: string;
  create_wallet: boolean;
  wallet_config: {
    daily_spending_limit: string;
    enable_staking: boolean;
    whitelisted_tokens: string[];
  };
  network: "avalanche" | "kite";
}

interface CreatedAgent {
  id: string;
  name: string;
  [key: string]: unknown;
}

const agentTypes = [
  {
    id: "trading",
    name: "Trading Agent",
    description: "Executes trades, manages portfolios, and optimizes yields",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500",
  },
  {
    id: "data",
    name: "Data Agent",
    description: "Fetches, processes, and orchestrates data from various sources",
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500",
  },
  {
    id: "commerce",
    name: "Commerce Agent",
    description: "Handles purchases, subscriptions, and e-commerce operations",
    icon: Shield,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500",
  },
  {
    id: "general",
    name: "General Agent",
    description: "Flexible agent for custom tasks and workflows",
    icon: Bot,
    color: "text-zinc-500",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500",
  },
];

const availableCapabilities = {
  trading: [
    "swap_tokens",
    "provide_liquidity",
    "stake_tokens",
    "yield_optimization",
    "portfolio_rebalance",
    "limit_orders",
  ],
  data: [
    "fetch_prices",
    "fetch_weather",
    "fetch_news",
    "query_oracles",
    "aggregate_data",
    "stream_data",
  ],
  commerce: [
    "make_purchases",
    "manage_subscriptions",
    "process_payments",
    "handle_refunds",
    "inventory_check",
  ],
  general: [
    "execute_transactions",
    "sign_messages",
    "interact_contracts",
    "schedule_tasks",
    "send_notifications",
  ],
};

const availableTokens = [
  { symbol: "AVAX", name: "Avalanche", address: "0x0" },
  { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
  { symbol: "USDT", name: "Tether", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x50b7545627a5162F82A992c33b87aDc75187B218" },
];

export default function NewAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateAgentForm>({
    name: "",
    description: "",
    type: "general",
    capabilities: [],
    model: "gemini-2.0-flash",
    create_wallet: true,
    wallet_config: {
      daily_spending_limit: "100",
      enable_staking: false,
      whitelisted_tokens: ["AVAX", "USDC"],
    },
    network: "avalanche",
  });

  const [step, setStep] = useState(1);

  const createMutation = useMutation({
    mutationFn: (data: CreateAgentForm) => api.post<CreatedAgent>("/api/v1/agents/", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({
        title: "Agent Created",
        description: "Your new agent has been created successfully.",
      });
      router.push(`/dashboard/agents/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent.",
        variant: "destructive",
      });
    },
  });

  const selectedType = agentTypes.find((t) => t.id === form.type)!;
  const typeCapabilities = availableCapabilities[form.type];

  const toggleCapability = (cap: string) => {
    setForm((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const toggleToken = (symbol: string) => {
    setForm((prev) => ({
      ...prev,
      wallet_config: {
        ...prev.wallet_config,
        whitelisted_tokens: prev.wallet_config.whitelisted_tokens.includes(symbol)
          ? prev.wallet_config.whitelisted_tokens.filter((t) => t !== symbol)
          : [...prev.wallet_config.whitelisted_tokens, symbol],
      },
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.name.length >= 3 && form.description.length >= 10;
      case 2:
        return form.capabilities.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    createMutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Configure your autonomous AI agent step by step
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all",
                step === s
                  ? "bg-avalanche-500 text-white"
                  : step > s
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              )}
            >
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "h-1 w-16 rounded-full transition-all",
                  step > s ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-avalanche-500" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Give your agent a name and describe what it should do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Trading Bot Alpha"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <p className="text-xs text-zinc-500">
                Choose a unique, descriptive name for your agent
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what your agent will do..."
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <p className="text-xs text-zinc-500">
                Provide a clear description of the agent&apos;s purpose and behavior
              </p>
            </div>

            <div className="space-y-3">
              <Label>Agent Type *</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {agentTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = form.type === type.id;

                  return (
                    <div
                      key={type.id}
                      onClick={() =>
                        setForm({ ...form, type: type.id as CreateAgentForm["type"], capabilities: [] })
                      }
                      className={cn(
                        "cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md",
                        isSelected
                          ? `${type.border} bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800`
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${type.bg}`}>
                          <Icon className={`h-5 w-5 ${type.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{type.name}</p>
                          <p className="text-xs text-zinc-500">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <Select
                value={form.network}
                onValueChange={(v) => setForm({ ...form, network: v as "avalanche" | "kite" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avalanche">Avalanche Fuji (Testnet)</SelectItem>
                  <SelectItem value="kite">Kite Testnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Capabilities */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <selectedType.icon className={`h-5 w-5 ${selectedType.color}`} />
              Agent Capabilities
            </CardTitle>
            <CardDescription>
              Select the capabilities your {selectedType.name.toLowerCase()} will have
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {typeCapabilities.map((cap) => {
                const isSelected = form.capabilities.includes(cap);
                return (
                  <Badge
                    key={cap}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-sm transition-all",
                      isSelected && "bg-avalanche-500 hover:bg-avalanche-600"
                    )}
                    onClick={() => toggleCapability(cap)}
                  >
                    {isSelected && <Check className="mr-1 h-3 w-3" />}
                    {cap.replace(/_/g, " ")}
                  </Badge>
                );
              })}
            </div>

            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="text-sm font-medium">Selected Capabilities:</p>
              {form.capabilities.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-500">No capabilities selected yet</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1">
                  {form.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">
                      {cap.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={form.model}
                onValueChange={(v) => setForm({ ...form, model: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500">
                The AI model that will power your agent&apos;s decision-making
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Wallet Configuration */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Wallet Configuration
            </CardTitle>
            <CardDescription>
              Configure the agent&apos;s wallet and spending controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div>
                <p className="font-medium">Create Agent Wallet</p>
                <p className="text-sm text-zinc-500">
                  Deploy a smart contract wallet for this agent
                </p>
              </div>
              <Switch
                checked={form.create_wallet}
                onCheckedChange={(checked) =>
                  setForm({ ...form, create_wallet: checked })
                }
              />
            </div>

            {form.create_wallet && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="spending_limit">Daily Spending Limit (AVAX)</Label>
                  <Input
                    id="spending_limit"
                    type="number"
                    placeholder="100"
                    value={form.wallet_config.daily_spending_limit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        wallet_config: {
                          ...form.wallet_config,
                          daily_spending_limit: e.target.value,
                        },
                      })
                    }
                  />
                  <p className="text-xs text-zinc-500">
                    Maximum amount the agent can spend per day
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div>
                    <p className="font-medium">Enable Staking</p>
                    <p className="text-sm text-zinc-500">
                      Allow the agent to stake tokens for rewards
                    </p>
                  </div>
                  <Switch
                    checked={form.wallet_config.enable_staking}
                    onCheckedChange={(checked) =>
                      setForm({
                        ...form,
                        wallet_config: {
                          ...form.wallet_config,
                          enable_staking: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>Whitelisted Tokens</Label>
                  <p className="text-xs text-zinc-500">
                    Select tokens the agent is allowed to transact with
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableTokens.map((token) => {
                      const isSelected =
                        form.wallet_config.whitelisted_tokens.includes(token.symbol);
                      return (
                        <Badge
                          key={token.symbol}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer px-3 py-1.5 text-sm transition-all",
                            isSelected && "bg-emerald-500 hover:bg-emerald-600"
                          )}
                          onClick={() => toggleToken(token.symbol)}
                        >
                          {isSelected && <Check className="mr-1 h-3 w-3" />}
                          {token.symbol}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Summary */}
            <div className="rounded-lg bg-gradient-to-br from-avalanche-500/10 to-transparent p-4">
              <p className="font-semibold text-avalanche-500">Agent Summary</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Name:</span>
                  <span className="font-medium">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Type:</span>
                  <span className="font-medium">{selectedType.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Network:</span>
                  <span className="font-medium">
                    {form.network === "avalanche" ? "Avalanche Fuji" : "Kite Testnet"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Capabilities:</span>
                  <span className="font-medium">{form.capabilities.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Wallet:</span>
                  <span className="font-medium">
                    {form.create_wallet ? "Will be created" : "None"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button
            variant="gradient"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={handleSubmit}
            loading={createMutation.isPending}
            disabled={!canProceed()}
          >
            Create Agent
          </Button>
        )}
      </div>
    </div>
  );
}
