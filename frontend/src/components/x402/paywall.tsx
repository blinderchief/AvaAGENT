/**
 * Paywall Component
 * 
 * x402 HTTP payment protocol paywall for gating premium content.
 * Handles payment verification, wallet connection, and content unlocking.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  CreditCard,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatUsdcPrice, type Wallet as ThirdwebWallet } from '@/lib/thirdweb';

// ============================================================================
// Types
// ============================================================================

export interface PaywallTier {
  id: string;
  name: string;
  priceWei: string;
  priceUsd: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface PaywallProps {
  title?: string;
  description?: string;
  tiers: PaywallTier[];
  wallet: ThirdwebWallet | null;
  onPay: (tierId: string) => Promise<{ success: boolean; error?: string }>;
  onConnect?: () => void;
  isUnlocked?: boolean;
  children?: React.ReactNode;
}

type PaymentState = 'idle' | 'authorizing' | 'processing' | 'success' | 'error';

// ============================================================================
// Component
// ============================================================================

export function Paywall({
  title = 'Premium Content',
  description = 'Unlock access with a one-time payment using x402',
  tiers,
  wallet,
  onPay,
  onConnect,
  isUnlocked = false,
  children,
}: PaywallProps) {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(
    tiers.find((t) => t.popular)?.id || tiers[0]?.id || null
  );
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reset state when wallet changes
  useEffect(() => {
    setPaymentState('idle');
    setProgress(0);
    setError(null);
  }, [wallet]);

  const handlePayment = async () => {
    if (!selectedTier || !wallet) return;

    setPaymentState('authorizing');
    setError(null);
    setProgress(10);

    try {
      // Simulate authorization step
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(30);
      setPaymentState('processing');

      // Process payment
      setProgress(50);
      const result = await onPay(selectedTier);
      setProgress(80);

      if (result.success) {
        setProgress(100);
        setPaymentState('success');
        toast({
          title: 'Payment Successful',
          description: 'Content has been unlocked!',
        });
      } else {
        setPaymentState('error');
        setError(result.error || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: result.error || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setPaymentState('error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getSelectedTier = () => tiers.find((t) => t.id === selectedTier);

  // Show unlocked content
  if (isUnlocked || paymentState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-500/20">
                <Unlock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-green-700 dark:text-green-400">
                  Content Unlocked
                </CardTitle>
                <CardDescription>
                  Thank you for your payment via x402
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            x402 Protocol
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            Instant Access
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tier Selection */}
        <div className="grid gap-3">
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="button"
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTier === tier.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedTier(tier.id)}
                disabled={paymentState !== 'idle'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedTier === tier.id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {selectedTier === tier.id && (
                        <CheckCircle className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tier.name}</span>
                        {tier.popular && (
                          <Badge variant="default" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      ${tier.priceUsd.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatUsdcPrice(tier.priceWei)}
                    </div>
                  </div>
                </div>
                {tier.features.length > 0 && selectedTier === tier.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t"
                  >
                    <ul className="space-y-1">
                      {tier.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <Separator />

        {/* Payment Progress */}
        <AnimatePresence>
          {['authorizing', 'processing'].includes(paymentState) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {paymentState === 'authorizing' && 'Authorizing payment...'}
                  {paymentState === 'processing' && 'Processing transaction...'}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {!wallet ? (
          <Button
            className="w-full"
            size="lg"
            onClick={onConnect}
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet to Pay
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={
              !selectedTier ||
              paymentState === 'authorizing' ||
              paymentState === 'processing'
            }
          >
            {paymentState === 'authorizing' || paymentState === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay {getSelectedTier()?.priceUsd.toFixed(2)} USDC
              </>
            )}
          </Button>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Payments processed via x402 protocol on Avalanche.
          <br />
          Your payment unlocks instant access to this content.
        </p>
      </CardContent>
    </Card>
  );
}

export default Paywall;
