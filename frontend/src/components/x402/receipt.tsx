/**
 * Receipt Component
 * 
 * Displays a payment receipt for x402 transactions.
 * Shows transaction details, verification, and download options.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  Share2,
  Clock,
  DollarSign,
  Wallet,
  Hash,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { shortenAddress, getExplorerUrl, formatUsdcPrice } from '@/lib/thirdweb';

// ============================================================================
// Types
// ============================================================================

export interface ReceiptData {
  id: string;
  txHash: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
  from: string;
  to: string;
  amount: string;
  amountUsd: number;
  network: string;
  chainId: number;
  resourceUrl?: string;
  tier?: string;
  metadata?: Record<string, unknown>;
}

export interface ReceiptProps {
  receipt: ReceiptData;
  onClose?: () => void;
  showActions?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function Receipt({
  receipt,
  onClose,
  showActions = true,
}: ReceiptProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'Copied!',
      description: `${field} copied to clipboard`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const shareReceipt = async () => {
    const text = `x402 Payment Receipt\n\nAmount: ${formatUsdcPrice(receipt.amount)} (${receipt.amountUsd.toFixed(2)} USD)\nTransaction: ${receipt.txHash}\nTime: ${formatDate(receipt.timestamp)}\n\nVerify: ${getExplorerUrl(receipt.txHash, receipt.chainId)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'x402 Payment Receipt',
          text,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard(text, 'Receipt');
    }
  };

  const downloadReceipt = () => {
    const receiptData = {
      ...receipt,
      formattedAmount: formatUsdcPrice(receipt.amount),
      formattedDate: formatDate(receipt.timestamp),
      explorerUrl: getExplorerUrl(receipt.txHash, receipt.chainId),
    };

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x402-receipt-${receipt.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Receipt saved to your device',
    });
  };

  const CopyButton = ({
    text,
    field,
  }: {
    text: string;
    field: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => copyToClipboard(text, field)}
        >
          {copiedField === field ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy {field}</TooltipContent>
    </Tooltip>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="overflow-hidden">
        {/* Header with Success Animation */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 pt-6 pb-4">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
            >
              <CheckCircle className="h-8 w-8 text-green-500" />
            </motion.div>
            <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
              Payment Successful
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Transaction confirmed on {receipt.network}
            </p>
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Receipt Details
            </CardTitle>
            <Badge variant="outline">
              {receipt.tier || 'x402 Payment'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Amount Paid
            </div>
            <div className="text-3xl font-bold">
              ${receipt.amountUsd.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatUsdcPrice(receipt.amount)} USDC
            </div>
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="space-y-3">
            {/* Transaction Hash */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Transaction Hash
              </div>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {shortenAddress(receipt.txHash, 8)}
                </code>
                <CopyButton text={receipt.txHash} field="Hash" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        window.open(
                          getExplorerUrl(receipt.txHash, receipt.chainId),
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View on Explorer</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* From Address */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                From
              </div>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {shortenAddress(receipt.from, 6)}
                </code>
                <CopyButton text={receipt.from} field="From Address" />
              </div>
            </div>

            {/* To Address */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                To
              </div>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {shortenAddress(receipt.to, 6)}
                </code>
                <CopyButton text={receipt.to} field="To Address" />
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Time
              </div>
              <span className="text-sm">{formatDate(receipt.timestamp)}</span>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <Badge variant="outline">{receipt.network}</Badge>
            </div>

            {/* Resource URL */}
            {receipt.resourceUrl && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resource</span>
                <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                  {receipt.resourceUrl}
                </code>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={downloadReceipt}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={shareReceipt}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </>
          )}

          {onClose && (
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Mini Receipt
// ============================================================================

export interface MiniReceiptProps {
  txHash: string;
  amount: string;
  chainId?: number;
}

export function MiniReceipt({
  txHash,
  amount,
  chainId = 43113,
}: MiniReceiptProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = async () => {
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Payment of {formatUsdcPrice(amount)} confirmed
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <code className="text-xs text-muted-foreground truncate">
            {shortenAddress(txHash, 6)}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={copyHash}
          >
            {copied ? (
              <Check className="h-2 w-2" />
            ) : (
              <Copy className="h-2 w-2" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() =>
              window.open(getExplorerUrl(txHash, chainId), '_blank')
            }
          >
            <ExternalLink className="h-2 w-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;
