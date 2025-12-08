/**
 * PolicyEditor Component
 * 
 * Visual editor for agent policies including spend limits,
 * contract allowlists, time locks, and intent requirements.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  DollarSign,
  Clock,
  FileCheck,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

export interface SpendLimitPolicy {
  enabled: boolean;
  daily: number;
  weekly: number;
  monthly: number;
  perTransaction: number;
}

export interface ContractAllowlistPolicy {
  enabled: boolean;
  contracts: Array<{
    address: string;
    name?: string;
    verified?: boolean;
  }>;
  mode: 'allowlist' | 'blocklist';
}

export interface TimeLockPolicy {
  enabled: boolean;
  delayHours: number;
  minAmount: number;
}

export interface IntentRequiredPolicy {
  enabled: boolean;
  minAmount: number;
  requireApproval: boolean;
  autoApproveBelow: number;
}

export interface AgentPolicies {
  spendLimit: SpendLimitPolicy;
  contractAllowlist: ContractAllowlistPolicy;
  timeLock: TimeLockPolicy;
  intentRequired: IntentRequiredPolicy;
}

interface PolicyEditorProps {
  policies: Partial<AgentPolicies>;
  onChange?: (policies: AgentPolicies) => void;
  onSave?: (policies: AgentPolicies) => Promise<void>;
  readOnly?: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_POLICIES: AgentPolicies = {
  spendLimit: {
    enabled: true,
    daily: 100,
    weekly: 500,
    monthly: 2000,
    perTransaction: 50,
  },
  contractAllowlist: {
    enabled: false,
    contracts: [],
    mode: 'allowlist',
  },
  timeLock: {
    enabled: false,
    delayHours: 24,
    minAmount: 100,
  },
  intentRequired: {
    enabled: true,
    minAmount: 10,
    requireApproval: false,
    autoApproveBelow: 5,
  },
};

// ============================================================================
// Component
// ============================================================================

export function PolicyEditor({
  policies: initialPolicies,
  onChange,
  onSave,
  readOnly = false,
}: PolicyEditorProps) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<AgentPolicies>({
    ...DEFAULT_POLICIES,
    ...initialPolicies,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newContract, setNewContract] = useState({ address: '', name: '' });
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    setPolicies({
      ...DEFAULT_POLICIES,
      ...initialPolicies,
    });
  }, [initialPolicies]);

  const updatePolicy = <K extends keyof AgentPolicies>(
    key: K,
    value: Partial<AgentPolicies[K]>
  ) => {
    const newPolicies = {
      ...policies,
      [key]: { ...policies[key], ...value },
    };
    setPolicies(newPolicies);
    setIsDirty(true);
    onChange?.(newPolicies);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(policies);
      setIsDirty(false);
      toast({
        title: 'Policies saved',
        description: 'Agent policies have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save policies. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPolicies(DEFAULT_POLICIES);
    setIsDirty(true);
    setShowResetDialog(false);
    onChange?.(DEFAULT_POLICIES);
  };

  const addContract = () => {
    if (!newContract.address) return;
    
    const contracts = [
      ...policies.contractAllowlist.contracts,
      {
        address: newContract.address.toLowerCase(),
        name: newContract.name || undefined,
        verified: false,
      },
    ];
    
    updatePolicy('contractAllowlist', { contracts });
    setNewContract({ address: '', name: '' });
  };

  const removeContract = (address: string) => {
    const contracts = policies.contractAllowlist.contracts.filter(
      (c) => c.address !== address
    );
    updatePolicy('contractAllowlist', { contracts });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Policy Configuration</h3>
          {isDirty && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Unsaved Changes
            </Badge>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
            >
              Reset to Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Policies'}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="spend" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spend" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Spend Limits</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Contracts</span>
          </TabsTrigger>
          <TabsTrigger value="timelock" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Time Lock</span>
          </TabsTrigger>
          <TabsTrigger value="intent" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Intents</span>
          </TabsTrigger>
        </TabsList>

        {/* Spend Limits */}
        <TabsContent value="spend" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Spend Limits</CardTitle>
                  <CardDescription>
                    Control how much your agent can spend over different periods
                  </CardDescription>
                </div>
                <Switch
                  checked={policies.spendLimit.enabled}
                  onCheckedChange={(enabled) =>
                    updatePolicy('spendLimit', { enabled })
                  }
                  disabled={readOnly}
                />
              </div>
            </CardHeader>
            <AnimatePresence>
              {policies.spendLimit.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Daily Limit (USD)</Label>
                      <Input
                        type="number"
                        value={policies.spendLimit.daily}
                        onChange={(e) =>
                          updatePolicy('spendLimit', {
                            daily: Number(e.target.value),
                          })
                        }
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weekly Limit (USD)</Label>
                      <Input
                        type="number"
                        value={policies.spendLimit.weekly}
                        onChange={(e) =>
                          updatePolicy('spendLimit', {
                            weekly: Number(e.target.value),
                          })
                        }
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Limit (USD)</Label>
                      <Input
                        type="number"
                        value={policies.spendLimit.monthly}
                        onChange={(e) =>
                          updatePolicy('spendLimit', {
                            monthly: Number(e.target.value),
                          })
                        }
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Per Transaction Limit (USD)</Label>
                      <Input
                        type="number"
                        value={policies.spendLimit.perTransaction}
                        onChange={(e) =>
                          updatePolicy('spendLimit', {
                            perTransaction: Number(e.target.value),
                          })
                        }
                        disabled={readOnly}
                      />
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </TabsContent>

        {/* Contract Allowlist */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Contract Allowlist</CardTitle>
                  <CardDescription>
                    Restrict which contracts your agent can interact with
                  </CardDescription>
                </div>
                <Switch
                  checked={policies.contractAllowlist.enabled}
                  onCheckedChange={(enabled) =>
                    updatePolicy('contractAllowlist', { enabled })
                  }
                  disabled={readOnly}
                />
              </div>
            </CardHeader>
            <AnimatePresence>
              {policies.contractAllowlist.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select
                        value={policies.contractAllowlist.mode}
                        onValueChange={(mode: 'allowlist' | 'blocklist') =>
                          updatePolicy('contractAllowlist', { mode })
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="allowlist">
                            Allowlist (Only listed contracts)
                          </SelectItem>
                          <SelectItem value="blocklist">
                            Blocklist (All except listed)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Add Contract */}
                    {!readOnly && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Contract address (0x...)"
                          value={newContract.address}
                          onChange={(e) =>
                            setNewContract({ ...newContract, address: e.target.value })
                          }
                          className="flex-1"
                        />
                        <Input
                          placeholder="Name (optional)"
                          value={newContract.name}
                          onChange={(e) =>
                            setNewContract({ ...newContract, name: e.target.value })
                          }
                          className="w-40"
                        />
                        <Button onClick={addContract} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Contract List */}
                    <div className="space-y-2">
                      {policies.contractAllowlist.contracts.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Info className="h-8 w-8 mx-auto mb-2" />
                          <p>No contracts added yet</p>
                        </div>
                      ) : (
                        policies.contractAllowlist.contracts.map((contract) => (
                          <div
                            key={contract.address}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              {contract.verified ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              <code className="text-xs">
                                {contract.address.slice(0, 10)}...
                                {contract.address.slice(-8)}
                              </code>
                              {contract.name && (
                                <Badge variant="outline">{contract.name}</Badge>
                              )}
                            </div>
                            {!readOnly && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeContract(contract.address)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </TabsContent>

        {/* Time Lock */}
        <TabsContent value="timelock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Time Lock</CardTitle>
                  <CardDescription>
                    Add delays to large transactions for security
                  </CardDescription>
                </div>
                <Switch
                  checked={policies.timeLock.enabled}
                  onCheckedChange={(enabled) =>
                    updatePolicy('timeLock', { enabled })
                  }
                  disabled={readOnly}
                />
              </div>
            </CardHeader>
            <AnimatePresence>
              {policies.timeLock.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Delay (Hours)</Label>
                      <Input
                        type="number"
                        value={policies.timeLock.delayHours}
                        onChange={(e) =>
                          updatePolicy('timeLock', {
                            delayHours: Number(e.target.value),
                          })
                        }
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Amount (USD)</Label>
                      <Input
                        type="number"
                        value={policies.timeLock.minAmount}
                        onChange={(e) =>
                          updatePolicy('timeLock', {
                            minAmount: Number(e.target.value),
                          })
                        }
                        disabled={readOnly}
                      />
                      <p className="text-xs text-muted-foreground">
                        Time lock applies to transactions above this amount
                      </p>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </TabsContent>

        {/* Intent Requirements */}
        <TabsContent value="intent" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Intent Requirements</CardTitle>
                  <CardDescription>
                    Require intents with rationale for transparency
                  </CardDescription>
                </div>
                <Switch
                  checked={policies.intentRequired.enabled}
                  onCheckedChange={(enabled) =>
                    updatePolicy('intentRequired', { enabled })
                  }
                  disabled={readOnly}
                />
              </div>
            </CardHeader>
            <AnimatePresence>
              {policies.intentRequired.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Minimum Amount (USD)</Label>
                        <Input
                          type="number"
                          value={policies.intentRequired.minAmount}
                          onChange={(e) =>
                            updatePolicy('intentRequired', {
                              minAmount: Number(e.target.value),
                            })
                          }
                          disabled={readOnly}
                        />
                        <p className="text-xs text-muted-foreground">
                          Intent required for transactions above this amount
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Auto-Approve Below (USD)</Label>
                        <Input
                          type="number"
                          value={policies.intentRequired.autoApproveBelow}
                          onChange={(e) =>
                            updatePolicy('intentRequired', {
                              autoApproveBelow: Number(e.target.value),
                            })
                          }
                          disabled={readOnly}
                        />
                        <p className="text-xs text-muted-foreground">
                          Automatically approve intents below this amount
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Require Manual Approval</p>
                        <p className="text-sm text-muted-foreground">
                          All intents require your explicit approval
                        </p>
                      </div>
                      <Switch
                        checked={policies.intentRequired.requireApproval}
                        onCheckedChange={(requireApproval) =>
                          updatePolicy('intentRequired', { requireApproval })
                        }
                        disabled={readOnly}
                      />
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Policies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all policies to their default values. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Reset Policies
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PolicyEditor;
