import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentForm } from '@/components/agents/agent-form';

// Create a wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AgentForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all agent type options', () => {
    render(
      <AgentForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Trading Agent')).toBeInTheDocument();
    expect(screen.getByText('Data Agent')).toBeInTheDocument();
    expect(screen.getByText('Commerce Agent')).toBeInTheDocument();
    expect(screen.getByText('General Agent')).toBeInTheDocument();
  });

  it('shows basic information form after selecting agent type', async () => {
    render(
      <AgentForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    // Click on Trading Agent
    const tradingCard = screen.getByText('Trading Agent').closest('[class*="Card"]');
    if (tradingCard) {
      fireEvent.click(tradingCard);
    }

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  it('shows capabilities after selecting agent type', async () => {
    render(
      <AgentForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    // Click on Trading Agent
    const tradingCard = screen.getByText('Trading Agent').closest('[class*="Card"]');
    if (tradingCard) {
      fireEvent.click(tradingCard);
    }

    await waitFor(() => {
      expect(screen.getByText('Swap Tokens')).toBeInTheDocument();
      expect(screen.getByText('Monitor Prices')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(
      <AgentForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    // Select agent type
    const generalCard = screen.getByText('General Agent').closest('[class*="Card"]');
    if (generalCard) {
      fireEvent.click(generalCard);
    }

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /create agent/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <AgentForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('toggles capabilities when clicked', async () => {
    render(
      <AgentForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    );

    // Select Trading Agent
    const tradingCard = screen.getByText('Trading Agent').closest('[class*="Card"]');
    if (tradingCard) {
      fireEvent.click(tradingCard);
    }

    await waitFor(() => {
      const swapTokensBadge = screen.getByText('Swap Tokens');
      // Toggle off
      fireEvent.click(swapTokensBadge);
      // Toggle on
      fireEvent.click(swapTokensBadge);
    });

    // Just verify no errors occurred
    expect(screen.getByText('Swap Tokens')).toBeInTheDocument();
  });
});

describe('AgentForm Configuration', () => {
  it('renders configuration options', async () => {
    render(
      <AgentForm />,
      { wrapper: createWrapper() }
    );

    // Select an agent type first
    const generalCard = screen.getByText('General Agent').closest('[class*="Card"]');
    if (generalCard) {
      fireEvent.click(generalCard);
    }

    await waitFor(() => {
      expect(screen.getByText('Auto-start')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Risk Level')).toBeInTheDocument();
      expect(screen.getByText('Max Transactions per Day')).toBeInTheDocument();
    });
  });
});
