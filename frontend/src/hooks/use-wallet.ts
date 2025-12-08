"use client";

import { useState, useCallback, useEffect } from "react";
import { useWalletStore } from "@/lib/store";

// Avalanche Network configurations
export const NETWORKS = {
  "avalanche-fuji": {
    chainId: 43113,
    chainIdHex: "0xa869",
    name: "Avalanche Fuji Testnet",
    currency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
  },
  "kite-testnet": {
    chainId: 2368,
    chainIdHex: "0x940",
    name: "Kite AI Testnet",
    currency: {
      name: "KITE",
      symbol: "KITE",
      decimals: 18,
    },
    rpcUrl: "https://rpc-testnet.gokite.ai/",
    explorerUrl: "https://explorer.gokite.ai",
  },
} as const;

export type NetworkId = keyof typeof NETWORKS;

interface UseWalletReturn {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (networkId: NetworkId) => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setConnected, setWalletAddress, setBalance: setStoreBalance } = useWalletStore();

  const isConnected = !!address;

  // Check if MetaMask is installed
  const getEthereum = useCallback(() => {
    if (typeof window !== "undefined") {
      return (window as any).ethereum;
    }
    return null;
  }, []);

  // Get balance
  const fetchBalance = useCallback(async (addr: string) => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    try {
      const balanceHex = await ethereum.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      });
      const balanceWei = BigInt(balanceHex);
      const balanceEth = Number(balanceWei) / 1e18;
      const formatted = balanceEth.toFixed(4);
      setBalance(formatted);
      setStoreBalance(formatted);
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, [getEthereum, setStoreBalance]);

  // Connect wallet
  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError("MetaMask not installed");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request accounts
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setWalletAddress(accounts[0]);
        setConnected(true);
        
        // Get chain ID
        const chainIdHex = await ethereum.request({
          method: "eth_chainId",
        });
        setChainId(parseInt(chainIdHex, 16));

        // Fetch balance
        await fetchBalance(accounts[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [getEthereum, fetchBalance, setConnected, setWalletAddress]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setConnected(false);
    setWalletAddress(null);
    setStoreBalance(null);
  }, [setConnected, setWalletAddress, setStoreBalance]);

  // Switch network
  const switchNetwork = useCallback(async (networkId: NetworkId) => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError("MetaMask not installed");
      return;
    }

    const network = NETWORKS[networkId];

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainIdHex }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainIdHex,
                chainName: network.name,
                nativeCurrency: network.currency,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorerUrl],
              },
            ],
          });
        } catch (addError: any) {
          setError(addError.message || "Failed to add network");
        }
      } else {
        setError(switchError.message || "Failed to switch network");
      }
    }
  }, [getEthereum]);

  // Listen for account/network changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
        setWalletAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      if (address) {
        fetchBalance(address);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    // Check if already connected
    ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setWalletAddress(accounts[0]);
        setConnected(true);
        fetchBalance(accounts[0]);
        ethereum.request({ method: "eth_chainId" }).then((chainIdHex: string) => {
          setChainId(parseInt(chainIdHex, 16));
        });
      }
    });

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [address, getEthereum, disconnect, fetchBalance, setConnected, setWalletAddress]);

  return {
    address,
    balance,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
  };
}
