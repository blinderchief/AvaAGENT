'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Zap, Database, ShoppingCart, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { agentsApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// Schema
const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['trading', 'data', 'commerce', 'general']),
  capabilities: z.array(z.string()).min(1, 'Select at least one capability'),
  config: z.object({
    autoStart: z.boolean().default(false),
    maxTransactions: z.number().min(1).max(1000).default(100),
    riskLevel: z.enum(['low', 'medium', 'high']).default('medium'),
    notifications: z.boolean().default(true),
  }),
});

type AgentFormData = z.infer<typeof agentSchema>;

// Agent type configurations
const agentTypes = [
  {
    value: 'trading',
    label: 'Trading Agent',
    description: 'Execute trades and manage portfolios',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
    capabilities: ['swap_tokens', 'monitor_prices', 'execute_orders', 'portfolio_rebalance'],
  },
  {
    value: 'data',
    label: 'Data Agent',
    description: 'Fetch, analyze and process on-chain data',
    icon: Database,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    capabilities: ['fetch_prices', 'analyze_trends', 'generate_reports', 'alert_conditions'],
  },
  {
    value: 'commerce',
    label: 'Commerce Agent',
    description: 'Handle payments and purchases',
    icon: ShoppingCart,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    capabilities: ['search_products', 'process_payments', 'track_orders', 'manage_subscriptions'],
  },
  {
    value: 'general',
    label: 'General Agent',
    description: 'Custom multi-purpose agent',
    icon: Bot,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10 border-zinc-500/20',
    capabilities: ['custom_actions', 'webhooks', 'scheduled_tasks', 'integrations'],
  },
] as const;

// Capability labels
const capabilityLabels: Record<string, string> = {
  swap_tokens: 'Swap Tokens',
  monitor_prices: 'Monitor Prices',
  execute_orders: 'Execute Orders',
  portfolio_rebalance: 'Portfolio Rebalance',
  fetch_prices: 'Fetch Prices',
  analyze_trends: 'Analyze Trends',
  generate_reports: 'Generate Reports',
  alert_conditions: 'Alert Conditions',
  search_products: 'Search Products',
  process_payments: 'Process Payments',
  track_orders: 'Track Orders',
  manage_subscriptions: 'Manage Subscriptions',
  custom_actions: 'Custom Actions',
  webhooks: 'Webhooks',
  scheduled_tasks: 'Scheduled Tasks',
  integrations: 'Integrations',
};

interface AgentFormProps {
  onSuccess?: (agent: unknown) => void;
  onCancel?: () => void;
  initialData?: Partial<AgentFormData>;
  mode?: 'create' | 'edit';
}

export function AgentForm({ onSuccess, onCancel, initialData, mode = 'create' }: AgentFormProps) {
  const [selectedType, setSelectedType] = useState<string>(initialData?.type || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'general',
      capabilities: initialData?.capabilities || [],
      config: {
        autoStart: initialData?.config?.autoStart ?? false,
        maxTransactions: initialData?.config?.maxTransactions ?? 100,
        riskLevel: initialData?.config?.riskLevel ?? 'medium',
        notifications: initialData?.config?.notifications ?? true,
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: agentsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Agent Created',
        description: `${data.name} has been created successfully.`,
        variant: 'success',
      });
      onSuccess?.(data);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create agent',
        variant: 'destructive',
      });
    },
  });

  const selectedTypeConfig = agentTypes.find((t) => t.value === selectedType);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    form.setValue('type', type as AgentFormData['type']);
    
    // Auto-select default capabilities for the type
    const typeConfig = agentTypes.find((t) => t.value === type);
    if (typeConfig) {
      form.setValue('capabilities', typeConfig.capabilities.slice(0, 2));
    }
  };

  const toggleCapability = (capability: string) => {
    const current = form.getValues('capabilities');
    if (current.includes(capability)) {
      form.setValue(
        'capabilities',
        current.filter((c) => c !== capability)
      );
    } else {
      form.setValue('capabilities', [...current, capability]);
    }
  };

  const onSubmit = (data: AgentFormData) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Agent Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Agent Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agentTypes.map((type) => (
            <Card
              key={type.value}
              className={cn(
                'cursor-pointer transition-all hover:border-zinc-600',
                selectedType === type.value
                  ? `${type.bg} border-2`
                  : 'border-zinc-800 hover:bg-zinc-900/50'
              )}
              onClick={() => handleTypeSelect(type.value)}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn('p-2 rounded-lg', type.bg)}>
                  <type.icon className={cn('h-6 w-6', type.color)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{type.label}</h3>
                  <p className="text-sm text-zinc-400">{type.description}</p>
                </div>
                {selectedType === type.value && (
                  <Badge variant="success" className="shrink-0">
                    Selected
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {form.formState.errors.type && (
          <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
        )}
      </div>

      {/* Basic Info */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Configure your agent&apos;s identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Trading Bot"
              {...form.register('name')}
              className={form.formState.errors.name ? 'border-red-500' : ''}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this agent does..."
              rows={3}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      {selectedTypeConfig && (
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>Select the actions this agent can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedTypeConfig.capabilities.map((capability) => {
                const isSelected = form.watch('capabilities').includes(capability);
                return (
                  <Badge
                    key={capability}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all',
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500/30'
                        : 'hover:bg-zinc-800'
                    )}
                    onClick={() => toggleCapability(capability)}
                  >
                    {isSelected ? (
                      <X className="h-3 w-3 mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    {capabilityLabels[capability] || capability}
                  </Badge>
                );
              })}
            </div>
            {form.formState.errors.capabilities && (
              <p className="text-sm text-red-500 mt-2">
                {form.formState.errors.capabilities.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Fine-tune your agent&apos;s behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-start</Label>
              <p className="text-sm text-zinc-400">
                Automatically start agent after creation
              </p>
            </div>
            <Switch
              checked={form.watch('config.autoStart')}
              onCheckedChange={(checked) => form.setValue('config.autoStart', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-zinc-400">
                Receive alerts for important agent activities
              </p>
            </div>
            <Switch
              checked={form.watch('config.notifications')}
              onCheckedChange={(checked) => form.setValue('config.notifications', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Risk Level</Label>
            <Select
              value={form.watch('config.riskLevel')}
              onValueChange={(value) =>
                form.setValue('config.riskLevel', value as 'low' | 'medium' | 'high')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Low - Conservative actions only
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Medium - Balanced approach
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    High - Aggressive strategies
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Max Transactions per Day</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              {...form.register('config.maxTransactions', { valueAsNumber: true })}
            />
            <p className="text-xs text-zinc-500">
              Limit the number of transactions this agent can execute daily
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="gradient"
          disabled={createMutation.isPending || !selectedType}
        >
          {createMutation.isPending ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create Agent' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Export a card preview component
export function AgentPreviewCard({ agent }: { agent: AgentFormData }) {
  const typeConfig = agentTypes.find((t) => t.value === agent.type);
  
  return (
    <Card className="border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {typeConfig && (
            <div className={cn('p-3 rounded-xl', typeConfig.bg)}>
              <typeConfig.icon className={cn('h-8 w-8', typeConfig.color)} />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{agent.name || 'Untitled Agent'}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {agent.description || 'No description provided'}
            </p>
            <div className="flex flex-wrap gap-1 mt-3">
              {agent.capabilities.map((cap) => (
                <Badge key={cap} variant="secondary" className="text-xs">
                  {capabilityLabels[cap] || cap}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
