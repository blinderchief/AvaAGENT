'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Types
interface IntentAction {
  id: string;
  type: 'swap' | 'transfer' | 'stake' | 'purchase' | 'analyze' | 'notify';
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  params: Record<string, unknown>;
  result?: unknown;
  error?: string;
  txHash?: string;
}

interface Intent {
  id: string;
  type: string;
  description: string;
  confidence: number;
  actions: IntentAction[];
  status: 'analyzing' | 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: string;
  executedAt?: string;
}

interface IntentExecutorProps {
  intent: Intent;
  onApprove: () => Promise<void>;
  onReject: () => void;
  onRetry?: () => void;
}

// Action type configurations
const actionTypeConfig: Record<string, { icon: typeof Zap; color: string; label: string }> = {
  swap: { icon: Zap, color: 'text-amber-500', label: 'Token Swap' },
  transfer: { icon: ArrowRight, color: 'text-blue-500', label: 'Transfer' },
  stake: { icon: Zap, color: 'text-emerald-500', label: 'Staking' },
  purchase: { icon: Zap, color: 'text-purple-500', label: 'Purchase' },
  analyze: { icon: Zap, color: 'text-cyan-500', label: 'Analysis' },
  notify: { icon: Zap, color: 'text-zinc-500', label: 'Notification' },
};

// Status badge variants
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
  pending: 'secondary',
  executing: 'warning',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
  analyzing: 'secondary',
};

export function IntentExecutor({ intent, onApprove, onReject, onRetry }: IntentExecutorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  const completedActions = intent.actions.filter((a) => a.status === 'completed').length;
  const progress = (completedActions / intent.actions.length) * 100;

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  }, [onApprove]);

  return (
    <Card className="border-zinc-800 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {intent.type}
              <Badge variant={statusVariants[intent.status]}>
                {intent.status.charAt(0).toUpperCase() + intent.status.slice(1)}
              </Badge>
            </CardTitle>
            <CardDescription>{intent.description}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Confidence meter */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-zinc-400">Confidence:</span>
          <Progress value={intent.confidence * 100} className="flex-1 h-2" />
          <span className="text-xs font-medium">{Math.round(intent.confidence * 100)}%</span>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-4">
              {/* Progress bar for execution */}
              {intent.status === 'executing' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-zinc-400">Execution Progress</span>
                    <span>
                      {completedActions}/{intent.actions.length} actions
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Actions list */}
              <div className="space-y-2">
                {intent.actions.map((action, index) => (
                  <ActionCard key={action.id} action={action} index={index} />
                ))}
              </div>

              {/* Action buttons */}
              {intent.status === 'pending' && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                  <Button variant="outline" onClick={onReject}>
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve & Execute
                      </>
                    )}
                  </Button>
                </div>
              )}

              {intent.status === 'failed' && onRetry && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                  <Button variant="outline" onClick={onRetry}>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Individual action card
function ActionCard({ action, index }: { action: IntentAction; index: number }) {
  const config = actionTypeConfig[action.type] || actionTypeConfig.analyze;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        action.status === 'completed' && 'border-emerald-500/30 bg-emerald-500/5',
        action.status === 'failed' && 'border-red-500/30 bg-red-500/5',
        action.status === 'executing' && 'border-amber-500/30 bg-amber-500/5',
        action.status === 'pending' && 'border-zinc-800',
        action.status === 'cancelled' && 'border-zinc-800 opacity-50'
      )}
    >
      {/* Step number */}
      <div
        className={cn(
          'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
          action.status === 'completed' && 'bg-emerald-500 text-white',
          action.status === 'failed' && 'bg-red-500 text-white',
          action.status === 'executing' && 'bg-amber-500 text-white',
          action.status === 'pending' && 'bg-zinc-700 text-zinc-300',
          action.status === 'cancelled' && 'bg-zinc-800 text-zinc-500'
        )}
      >
        {action.status === 'completed' ? (
          <Check className="h-3 w-3" />
        ) : action.status === 'failed' ? (
          <X className="h-3 w-3" />
        ) : action.status === 'executing' ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          index + 1
        )}
      </div>

      {/* Action content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', config.color)}>{config.label}</span>
          {action.status === 'executing' && (
            <Badge variant="warning" className="text-xs">Executing...</Badge>
          )}
        </div>
        <p className="text-sm text-zinc-400 mt-0.5">{action.description}</p>

        {/* Error message */}
        {action.status === 'failed' && action.error && (
          <div className="flex items-start gap-2 mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{action.error}</p>
          </div>
        )}

        {/* Transaction hash */}
        {action.txHash && (
          <a
            href={`https://testnet.snowtrace.io/tx/${action.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2"
          >
            <span>View transaction</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// Intent summary component
interface IntentSummaryProps {
  intent: Intent;
  onClick?: () => void;
}

export function IntentSummary({ intent, onClick }: IntentSummaryProps) {
  const completedActions = intent.actions.filter((a) => a.status === 'completed').length;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-900/50 transition-colors cursor-pointer',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          intent.status === 'completed' && 'bg-emerald-500/20',
          intent.status === 'failed' && 'bg-red-500/20',
          intent.status === 'executing' && 'bg-amber-500/20',
          intent.status === 'pending' && 'bg-zinc-800'
        )}
      >
        {intent.status === 'completed' ? (
          <Check className="h-5 w-5 text-emerald-400" />
        ) : intent.status === 'failed' ? (
          <X className="h-5 w-5 text-red-400" />
        ) : intent.status === 'executing' ? (
          <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
        ) : (
          <Zap className="h-5 w-5 text-zinc-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{intent.description}</h4>
        <p className="text-sm text-zinc-400">
          {completedActions}/{intent.actions.length} actions •{' '}
          {new Date(intent.createdAt).toLocaleString()}
        </p>
      </div>

      <Badge variant={statusVariants[intent.status]}>
        {intent.status.charAt(0).toUpperCase() + intent.status.slice(1)}
      </Badge>
    </div>
  );
}
