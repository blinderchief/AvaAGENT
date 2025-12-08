"use client";

import { useState } from "react";
import {
  Wallet,
  LogOut,
  Copy,
  ExternalLink,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WalletConnectProps {
  address?: string;
  balance?: string;
  network?: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  className?: string;
}

const NETWORKS = [
  {
    id: "avalanche-fuji",
    name: "Avalanche Fuji",
    chainId: 43113,
    icon: "🔺",
    color: "text-red-500",
    explorer: "https://testnet.snowtrace.io",
  },
  {
    id: "kite-testnet",
    name: "Kite Testnet",
    chainId: 2368,
    icon: "🪁",
    color: "text-blue-500",
    explorer: "https://explorer.gokite.ai",
  },
];

const WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "Connect using MetaMask browser extension",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    description: "Scan QR code with a mobile wallet",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    description: "Connect using Coinbase Wallet",
  },
  {
    id: "core",
    name: "Core Wallet",
    icon: "⚫",
    description: "Connect using Avalanche Core Wallet",
  },
];

export function WalletConnect({
  address,
  balance,
  network = "avalanche-fuji",
  isConnected = false,
  isConnecting = false,
  onConnect,
  onDisconnect,
  className,
}: WalletConnectProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const currentNetwork = NETWORKS.find((n) => n.id === network);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Address copied" });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleWalletSelect = (walletId: string) => {
    setDialogOpen(false);
    onConnect();
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn("gap-2", className)}>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono">{formatAddress(address)}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Connected Wallet</span>
              <Badge variant="success" className="text-xs">
                {currentNetwork?.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <code className="text-xs flex-1 truncate">{address}</code>
              <button
                onClick={copyAddress}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            {balance && (
              <div className="mt-2 text-right">
                <span className="text-sm text-zinc-500">Balance: </span>
                <span className="font-semibold">{balance} AVAX</span>
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href={`${currentNetwork?.explorer}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDisconnect}
            className="text-red-600 dark:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button
        variant="gradient"
        className={cn("gap-2", className)}
        onClick={() => setDialogOpen(true)}
        loading={isConnecting}
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to AvaAgent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {WALLETS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left"
              >
                <span className="text-3xl">{wallet.icon}</span>
                <div>
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-sm text-zinc-500">{wallet.description}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
            <p className="text-sm text-zinc-500">
              <strong>Network:</strong> {currentNetwork?.name} (Chain ID:{" "}
              {currentNetwork?.chainId})
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
