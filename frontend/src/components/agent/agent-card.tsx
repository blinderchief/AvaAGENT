/**
 * AgentCard Component
 * 
 * Displays agent information in a card format with status indicators,
 * quick actions, and key metrics.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Activity,
  Wallet,
  TrendingUp,
  MoreVertical,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Agent } from '@/lib/api-client';
import { shortenAddress, getExplorerUrl } from '@/lib/thirdweb';

interface AgentCardProps {
  agent: Agent;
  onActivate?: (agentId: string) => Promise<void>;
  onPause?: (agentId: string) => Promise<void>;
  onDelete?: (agentId: string) => Promise<void>;
  onSettings?: (agentId: string) => void;
  onViewDetails?: (agentId: string) => void;
  compact?: boolean;
}

const STATUS_COLORS = {
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  inactive: 'bg-gray-500',
  error: 'bg-red-500',
} as const;

const STATUS_BADGES = {
  active: { variant: 'default' as const, label: 'Active' },
  paused: { variant: 'secondary' as const, label: 'Paused' },
  inactive: { variant: 'outline' as const, label: 'Inactive' },
  error: { variant: 'destructive' as const, label: 'Error' },
};

export function AgentCard({
  agent,
  onActivate,
  onPause,
  onDelete,
  onSettings,
  onViewDetails,
  compact = false,
}: AgentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = (agent.status || 'inactive') as keyof typeof STATUS_COLORS;
  const statusConfig = STATUS_BADGES[status];

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Agent action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    if (agent.wallet_address) {
      await navigator.clipboard.writeText(agent.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate reputation score (mock for now)
  const reputationScore = Math.round(
    ((agent.total_transactions || 0) > 0 ? 0.7 : 0.3) * 100
  );

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails?.(agent.id)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.capabilities?.slice(0, 2).join(', ')}
                  {(agent.capabilities?.length || 0) > 2 && '...'}
                </p>
              </div>
            </div>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${STATUS_COLORS[status]}`}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {agent.description || 'No description'}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(agent.id)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSettings?.(agent.id)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(agent.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Wallet Address */}
          {agent.wallet_address && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <code className="text-xs flex-1">{shortenAddress(agent.wallet_address, 6)}</code>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="h-3 w-3 text-green-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="h-3 w-3" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy address</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.open(getExplorerUrl(agent.wallet_address!), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View on Explorer</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Capabilities */}
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities?.slice(0, 4).map((cap) => (
              <Badge key={cap} variant="outline" className="text-xs">
                {cap.replace(/_/g, ' ')}
              </Badge>
            ))}
            {(agent.capabilities?.length || 0) > 4 && (
              <Badge variant="outline" className="text-xs">
                +{(agent.capabilities?.length || 0) - 4} more
              </Badge>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span className="text-xs">Transactions</span>
              </div>
              <p className="text-lg font-semibold">{agent.total_transactions || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Success Rate</span>
              </div>
              <p className="text-lg font-semibold">
                {agent.total_transactions ? '98%' : '-'}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <span className="text-xs">Reputation</span>
              </div>
              <p className="text-lg font-semibold">{reputationScore}</p>
            </div>
          </div>

          {/* Reputation Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Reputation Score</span>
              <span>{reputationScore}/100</span>
            </div>
            <Progress value={reputationScore} className="h-1.5" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {status === 'active' ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onPause && handleAction(() => onPause(agent.id))}
                disabled={isLoading}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => onActivate && handleAction(() => onActivate(agent.id))}
                disabled={isLoading}
              >
                <Play className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSettings?.(agent.id)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AgentCard;
