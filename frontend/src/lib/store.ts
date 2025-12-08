import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  status: string;
  created_at: string;
}

interface Wallet {
  id: string;
  name: string;
  address: string;
  network: string;
  wallet_type: string;
}

interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  setAddress: (address: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setBalance: (balance: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  address: null,
  chainId: null,
  balance: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  setAddress: (address) => set({ address }),
  setChainId: (chainId) => set({ chainId }),
  setBalance: (balance) => set({ balance }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  setWalletAddress: (address) => set({ address }),
  reset: () =>
    set({
      address: null,
      chainId: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    }),
}));

interface AppState {
  // Agents
  agents: Agent[];
  selectedAgentId: string | null;
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;

  // Wallets
  wallets: Wallet[];
  selectedWalletId: string | null;
  setWallets: (wallets: Wallet[]) => void;
  addWallet: (wallet: Wallet) => void;
  selectWallet: (id: string | null) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Network
  selectedNetwork: string;
  setSelectedNetwork: (network: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Agents
      agents: [],
      selectedAgentId: null,
      setAgents: (agents) => set({ agents }),
      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),
      removeAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          selectedAgentId:
            state.selectedAgentId === id ? null : state.selectedAgentId,
        })),
      selectAgent: (id) => set({ selectedAgentId: id }),

      // Wallets
      wallets: [],
      selectedWalletId: null,
      setWallets: (wallets) => set({ wallets }),
      addWallet: (wallet) =>
        set((state) => ({ wallets: [...state.wallets, wallet] })),
      selectWallet: (id) => set({ selectedWalletId: id }),

      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Network
      selectedNetwork: 'avalanche_fuji',
      setSelectedNetwork: (network) => set({ selectedNetwork: network }),
    }),
    {
      name: 'avaagent-storage',
      partialize: (state) => ({
        selectedNetwork: state.selectedNetwork,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
