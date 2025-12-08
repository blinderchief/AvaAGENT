/**
 * CartSummary Component
 * 
 * Shopping cart summary for Reap Protocol commerce integration.
 * Displays cart items, totals, and checkout flow.
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  ArrowRight,
  Loader2,
  Check,
  X,
  Tag,
  Wallet,
  Shield,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  maxQuantity?: number;
}

export interface CartSummaryProps {
  items: CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onCheckout?: () => Promise<{ success: boolean; error?: string }>;
  onApplyPromoCode?: (code: string) => Promise<{ success: boolean; discount?: number; error?: string }>;
  walletConnected?: boolean;
  onConnectWallet?: () => void;
  currency?: string;
  taxRate?: number;
  shippingCost?: number;
  discount?: number;
  promoCode?: string | null;
}

// ============================================================================
// Component
// ============================================================================

export function CartSummary({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onApplyPromoCode,
  walletConnected = false,
  onConnectWallet,
  currency = 'USDC',
  taxRate = 0,
  shippingCost = 0,
  discount = 0,
  promoCode = null,
}: CartSummaryProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const tax = useMemo(() => subtotal * taxRate, [subtotal, taxRate]);
  
  const total = useMemo(() => {
    return Math.max(0, subtotal + tax + shippingCost - discount);
  }, [subtotal, tax, shippingCost, discount]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !onApplyPromoCode) return;

    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      const result = await onApplyPromoCode(promoInput);
      if (!result.success) {
        setPromoError(result.error || 'Invalid promo code');
      } else {
        setPromoInput('');
      }
    } catch (err) {
      setPromoError('Failed to apply promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (!onCheckout) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const result = await onCheckout();
      if (!result.success) {
        setCheckoutError(result.error || 'Checkout failed');
      }
    } catch (err) {
      setCheckoutError('An unexpected error occurred');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-muted mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add products to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <CardTitle>Cart</CardTitle>
          </div>
          <Badge variant="secondary">
            {itemCount} item{itemCount !== 1 && 's'}
          </Badge>
        </div>
        <CardDescription>
          Review your items before checkout
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cart Items */}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-4 pr-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-3"
                >
                  {/* Image */}
                  <div className="w-16 h-16 shrink-0 bg-muted rounded-md flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {item.name}
                      </h4>
                      <span className="font-medium text-sm shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${item.price.toFixed(2)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-r-none"
                          onClick={() =>
                            onUpdateQuantity?.(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-l-none"
                          onClick={() =>
                            onUpdateQuantity?.(item.id, item.quantity + 1)
                          }
                          disabled={
                            item.maxQuantity !== undefined &&
                            item.quantity >= item.maxQuantity
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onRemoveItem?.(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <Separator />

        {/* Promo Code */}
        {onApplyPromoCode && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="pl-9"
                  disabled={!!promoCode}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleApplyPromo}
                disabled={!promoInput.trim() || isApplyingPromo || !!promoCode}
              >
                {isApplyingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
            {promoCode && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Code "{promoCode}" applied (-${discount.toFixed(2)})
              </div>
            )}
            {promoError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <X className="h-4 w-4" />
                {promoError}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({(taxRate * 100).toFixed(0)}%)
              </span>
              <span>${tax.toFixed(2)}</span>
            </div>
          )}
          {shippingCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>
              ${total.toFixed(2)} {currency}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {checkoutError && (
          <Alert variant="destructive">
            <AlertDescription>{checkoutError}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {/* Checkout Button */}
        {walletConnected ? (
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={isCheckingOut || items.length === 0}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={onConnectWallet}
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet to Checkout
          </Button>
        )}

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secured by Reap Protocol on Avalanche</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                All transactions are processed securely through Reap Protocol
                smart contracts on the Avalanche network.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// Mini Cart
// ============================================================================

export interface MiniCartProps {
  items: CartItem[];
  onViewCart?: () => void;
}

export function MiniCart({ items, onViewCart }: MiniCartProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Button
      variant="outline"
      className="relative gap-2"
      onClick={onViewCart}
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {itemCount > 0 && (
        <>
          <span className="font-bold">${total.toFixed(2)}</span>
          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            {itemCount}
          </span>
        </>
      )}
    </Button>
  );
}

// ============================================================================
// Cart Badge
// ============================================================================

export interface CartBadgeProps {
  count: number;
  onClick?: () => void;
}

export function CartBadge({ count, onClick }: CartBadgeProps) {
  return (
    <button
      className="relative p-2 hover:bg-muted rounded-full transition-colors"
      onClick={onClick}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </button>
  );
}

export default CartSummary;
