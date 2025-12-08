import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock ethereum provider
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

describe('useWallet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup window.ethereum mock
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // @ts-ignore
    delete window.ethereum;
  });

  it('detects MetaMask availability', async () => {
    // Import the hook dynamically to ensure mock is in place
    const { useWallet } = await import('@/hooks/use-wallet');
    
    const { result } = renderHook(() => useWallet());

    expect(result.current.isMetaMaskInstalled).toBe(true);
  });

  it('connects to wallet successfully', async () => {
    mockEthereum.request.mockImplementation(async (args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return ['0x1234567890123456789012345678901234567890'];
      }
      if (args.method === 'eth_chainId') {
        return '0xa869'; // Avalanche Fuji
      }
      if (args.method === 'eth_getBalance') {
        return '0x1BC16D674EC80000'; // 2 ETH
      }
      return null;
    });

    const { useWallet } = await import('@/hooks/use-wallet');
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  it('handles connection error', async () => {
    mockEthereum.request.mockRejectedValue(new Error('User rejected'));

    const { useWallet } = await import('@/hooks/use-wallet');
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      try {
        await result.current.connect();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('disconnects wallet', async () => {
    mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

    const { useWallet } = await import('@/hooks/use-wallet');
    const { result } = renderHook(() => useWallet());

    // Connect first
    await act(async () => {
      await result.current.connect();
    });

    // Then disconnect
    await act(async () => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
  });

  it('switches network', async () => {
    mockEthereum.request.mockImplementation(async (args: { method: string; params?: unknown[] }) => {
      if (args.method === 'wallet_switchEthereumChain') {
        return null;
      }
      if (args.method === 'eth_chainId') {
        return '0x940'; // Kite testnet
      }
      return null;
    });

    const { useWallet } = await import('@/hooks/use-wallet');
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.switchNetwork('kite_testnet');
    });

    expect(mockEthereum.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: expect.any(String) }],
    });
  });
});
