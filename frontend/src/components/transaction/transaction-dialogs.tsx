"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  Check,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TransactionConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    type: "send" | "receive" | "swap" | "approve" | "contract";
    from: string;
    to: string;
    amount: string;
    token: string;
    gasEstimate?: string;
    data?: any;
  };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function TransactionConfirmDialog({
  open,
  onOpenChange,
  transaction,
  onConfirm,
  onCancel,
}: TransactionConfirmProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case "send":
        return <ArrowUpRight className="h-6 w-6" />;
      case "receive":
        return <ArrowDownLeft className="h-6 w-6" />;
      case "swap":
        return <RefreshCw className="h-6 w-6" />;
      default:
        return <ArrowUpRight className="h-6 w-6" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-avalanche-100 text-avalanche-600 dark:bg-avalanche-900/30">
              {getTypeIcon()}
            </div>
            Confirm Transaction
          </DialogTitle>
          <DialogDescription>
            Review the details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Type</span>
              <span className="font-medium capitalize">{transaction.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">From</span>
              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {transaction.from.slice(0, 8)}...{transaction.from.slice(-6)}
              </code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">To</span>
              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {transaction.to.slice(0, 8)}...{transaction.to.slice(-6)}
              </code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Amount</span>
              <span className="font-semibold">
                {transaction.amount} {transaction.token}
              </span>
            </div>
            {transaction.gasEstimate && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Estimated Gas</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  ~{transaction.gasEstimate} AVAX
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>Please verify all details. Transactions cannot be reversed.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleConfirm}
            loading={isConfirming}
          >
            Confirm Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TransactionStatusProps {
  status: "pending" | "confirming" | "success" | "error";
  txHash?: string;
  message?: string;
  explorerUrl?: string;
  onClose?: () => void;
}

export function TransactionStatusDialog({
  status,
  txHash,
  message,
  explorerUrl = "https://testnet.snowtrace.io",
  onClose,
}: TransactionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="h-8 w-8 animate-pulse" />,
          iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
          title: "Transaction Pending",
          description: "Your transaction is being processed...",
        };
      case "confirming":
        return {
          icon: <RefreshCw className="h-8 w-8 animate-spin" />,
          iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
          title: "Confirming Transaction",
          description: "Waiting for network confirmation...",
        };
      case "success":
        return {
          icon: <Check className="h-8 w-8" />,
          iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
          title: "Transaction Successful",
          description: message || "Your transaction has been confirmed.",
        };
      case "error":
        return {
          icon: <X className="h-8 w-8" />,
          iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30",
          title: "Transaction Failed",
          description: message || "Something went wrong. Please try again.",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Dialog open onOpenChange={() => onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center py-6">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full mb-4",
              config.iconBg
            )}
          >
            {config.icon}
          </div>
          <h3 className="text-xl font-semibold">{config.title}</h3>
          <p className="text-zinc-500 mt-2">{config.description}</p>

          {(status === "pending" || status === "confirming") && (
            <Progress value={status === "pending" ? 33 : 66} className="w-full mt-6" />
          )}

          {txHash && (
            <div className="mt-6 w-full">
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                <code className="text-xs truncate">{txHash}</code>
                <a
                  href={`${explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-avalanche-500 hover:text-avalanche-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {(status === "success" || status === "error") && (
            <Button variant="outline" className="mt-6" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TransactionListItemProps {
  transaction: {
    id: string;
    type: "send" | "receive" | "swap" | "contract";
    status: "success" | "pending" | "failed";
    amount: string;
    token: string;
    timestamp: string;
    hash?: string;
    from?: string;
    to?: string;
  };
  explorerUrl?: string;
  onClick?: () => void;
}

export function TransactionListItem({
  transaction,
  explorerUrl = "https://testnet.snowtrace.io",
  onClick,
}: TransactionListItemProps) {
  const getTypeIcon = () => {
    switch (transaction.type) {
      case "send":
        return <ArrowUpRight className="h-4 w-4" />;
      case "receive":
        return <ArrowDownLeft className="h-4 w-4" />;
      case "swap":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case "success":
        return <Badge variant="success">Success</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 transition-colors",
        onClick && "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            transaction.status === "success"
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
              : transaction.status === "pending"
              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
              : "bg-red-100 text-red-600 dark:bg-red-900/30"
          )}
        >
          {getTypeIcon()}
        </div>
        <div>
          <p className="font-medium capitalize">{transaction.type}</p>
          <p className="text-sm text-zinc-500">
            {new Date(transaction.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            transaction.type === "receive"
              ? "text-emerald-600"
              : transaction.type === "send"
              ? "text-red-600"
              : ""
          )}
        >
          {transaction.type === "receive" ? "+" : "-"}
          {transaction.amount} {transaction.token}
        </p>
        <div className="flex items-center gap-2 mt-1 justify-end">
          {getStatusBadge()}
          {transaction.hash && (
            <a
              href={`${explorerUrl}/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-avalanche-500"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
