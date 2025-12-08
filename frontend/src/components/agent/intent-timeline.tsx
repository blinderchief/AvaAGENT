/**
 * IntentTimeline Component
 * 
 * Displays a timeline of agent intents with their status,
 * rationale, and transaction details. Supports filtering and actions.
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getExplorerUrl, shortenAddress } from '@/lib/thirdweb';
import type { AgentIntent } from '@/lib/agents';

// ============================================================================
// Types
// ============================================================================

interface IntentTimelineProps {
  intents: AgentIntent[];
  onApprove?: (intentId: string) => Promise<void>;
  onReject?: (intentId: string, reason?: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  maxHeight?: number;
}

type IntentStatus = AgentIntent['status'];

// ============================================================================
// Status Configuration
// ============================================================================

const STATUS_CONFIG: Record<IntentStatus, {
  icon: typeof CheckCircle;
  color: string;
  bgColor: string;
  label: string;
}> = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Pending',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Approved',
  },
  executed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Executed',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Rejected',
  },
  failed: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'Failed',
  },
};

// ============================================================================
// Intent Item Component
// ============================================================================

interface IntentItemProps {
  intent: AgentIntent;
  onApprove?: (intentId: string) => Promise<void>;
  onReject?: (intentId: string, reason?: string) => Promise<void>;
  isFirst?: boolean;
  isLast?: boolean;
}

function IntentItem({ intent, onApprove, onReject, isFirst, isLast }: IntentItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const config = STATUS_CONFIG[intent.status];
  const StatusIcon = config.icon;

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsActioning(true);
    try {
      await onApprove(intent.id);
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsActioning(true);
    try {
      await onReject(intent.id);
    } finally {
      setIsActioning(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}
        >
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-border mt-2" />
        )}
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 pb-6"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{formatAction(intent.action)}</h4>
                <Badge
                  variant={intent.status === 'executed' ? 'default' : 'outline'}
                  className={config.color}
                >
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(intent.createdAt)}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Rationale Preview */}
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {intent.rationale}
          </p>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Separator className="my-4" />

                {/* Full Rationale */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Full Rationale
                    </p>
                    <p className="text-sm">{intent.rationale}</p>
                  </div>

                  {/* Parameters */}
                  {intent.params && Object.keys(intent.params).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Parameters
                      </p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(intent.params, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Transaction Hash */}
                  {intent.txHash && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Transaction:
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {shortenAddress(intent.txHash, 8)}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(intent.txHash!);
                            }}
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy hash</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getExplorerUrl(intent.txHash!), '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View on Explorer</TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* Execution Time */}
                  {intent.executedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Executed {formatDate(intent.executedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions for Pending Intents */}
                {intent.status === 'pending' && (onApprove || onReject) && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex gap-2">
                      {onApprove && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove();
                          }}
                          disabled={isActioning}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      {onReject && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject();
                          }}
                          disabled={isActioning}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function IntentTimeline({
  intents,
  onApprove,
  onReject,
  onRefresh,
  loading = false,
  maxHeight = 600,
}: IntentTimelineProps) {
  const [statusFilter, setStatusFilter] = useState<IntentStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredIntents = useMemo(() => {
    if (statusFilter.length === 0) return intents;
    return intents.filter((intent) => statusFilter.includes(intent.status));
  }, [intents, statusFilter]);

  const pendingCount = intents.filter((i) => i.status === 'pending').length;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleStatusFilter = (status: IntentStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Intent Timeline
              {pendingCount > 0 && (
                <Badge variant="secondary">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Track and manage your agent&apos;s actions and decisions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {statusFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {statusFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter.includes(status as IntentStatus)}
                    onCheckedChange={() =>
                      toggleStatusFilter(status as IntentStatus)
                    }
                  >
                    <config.icon className={`mr-2 h-4 w-4 ${config.color}`} />
                    {config.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          {loading ? (
            // Loading State
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredIntents.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No Intents Found</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter.length > 0
                  ? 'No intents match your filter criteria'
                  : 'Your agent has not executed any intents yet'}
              </p>
            </div>
          ) : (
            // Timeline
            <div className="space-y-0">
              {filteredIntents.map((intent, index) => (
                <IntentItem
                  key={intent.id}
                  intent={intent}
                  onApprove={onApprove}
                  onReject={onReject}
                  isFirst={index === 0}
                  isLast={index === filteredIntents.length - 1}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default IntentTimeline;
