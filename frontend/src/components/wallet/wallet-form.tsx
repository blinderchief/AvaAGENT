'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { walletsApi } from '@/lib/api-client';
import { networks, type NetworkKey } from '@/lib/env';
import { cn } from '@/lib/utils';

// Schema
const walletSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  network: z.enum(['avalanche_fuji', 'kite_testnet']),
  type: z.enum(['generated', 'imported']),
  privateKey: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'imported') {
      return data.privateKey && data.privateKey.length > 0;
    }
    return true;
  },
  {
    message: 'Private key is required for imported wallets',
    path: ['privateKey'],
  }
);

type WalletFormData = z.infer<typeof walletSchema>;

interface WalletFormProps {
  onSuccess?: (wallet: unknown) => void;
  onCancel?: () => void;
}

export function WalletForm({ onSuccess, onCancel }: WalletFormProps) {
  const [walletType, setWalletType] = useState<'generated' | 'imported'>('generated');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: '',
      network: 'avalanche_fuji',
      type: 'generated',
      privateKey: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: walletsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({
        title: 'Wallet Created',
        description: 'Your wallet has been created successfully.',
        variant: 'success',
      });
      onSuccess?.(data);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create wallet',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: WalletFormData) => {
    createMutation.mutate({
      name: data.name,
      network: data.network,
      type: data.type,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Wallet Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Wallet Type</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className={cn(
              'cursor-pointer transition-all hover:border-zinc-600',
              walletType === 'generated'
                ? 'border-indigo-500/50 bg-indigo-500/5'
                : 'border-zinc-800'
            )}
            onClick={() => {
              setWalletType('generated');
              form.setValue('type', 'generated');
            }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Key className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold">Generate New</h3>
                <p className="text-sm text-zinc-400">Create a fresh wallet</p>
              </div>
              {walletType === 'generated' && (
                <CheckCircle2 className="ml-auto h-5 w-5 text-indigo-400" />
              )}
            </CardContent>
          </Card>

          <Card
            className={cn(
              'cursor-pointer transition-all hover:border-zinc-600',
              walletType === 'imported'
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-zinc-800'
            )}
            onClick={() => {
              setWalletType('imported');
              form.setValue('type', 'imported');
            }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Wallet className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold">Import Existing</h3>
                <p className="text-sm text-zinc-400">Use your private key</p>
              </div>
              {walletType === 'imported' && (
                <CheckCircle2 className="ml-auto h-5 w-5 text-amber-400" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wallet Details */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle>Wallet Details</CardTitle>
          <CardDescription>Configure your wallet settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Wallet Name</Label>
            <Input
              id="name"
              placeholder="My Trading Wallet"
              {...form.register('name')}
              className={form.formState.errors.name ? 'border-red-500' : ''}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <Select
              value={form.watch('network')}
              onValueChange={(value) => form.setValue('network', value as NetworkKey)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(networks).map(([key, network]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          key === 'avalanche_fuji' ? 'bg-red-500' : 'bg-blue-500'
                        )}
                      />
                      {network.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {walletType === 'imported' && (
            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="0x..."
                {...form.register('privateKey')}
                className={form.formState.errors.privateKey ? 'border-red-500' : ''}
              />
              {form.formState.errors.privateKey && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.privateKey.message}
                </p>
              )}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-200">
                  Your private key will be encrypted and stored securely. Never share your
                  private key with anyone.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Info */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-zinc-800">
              <Wallet className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {networks[form.watch('network') as NetworkKey]?.name || 'Select Network'}
              </p>
              <p className="text-xs text-zinc-400">
                Chain ID: {networks[form.watch('network') as NetworkKey]?.chainId || '-'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {networks[form.watch('network') as NetworkKey]?.nativeCurrency.symbol || '-'}
              </p>
              <p className="text-xs text-zinc-400">Native Token</p>
            </div>
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
        <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Wallet
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
