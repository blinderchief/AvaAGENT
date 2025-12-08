/**
 * TierSelector Component
 * 
 * Payment tier selection component for x402 payments.
 * Displays available tiers with pricing and features.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Star,
  Sparkles,
  Crown,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatUsdcPrice } from '@/lib/thirdweb';

// ============================================================================
// Types
// ============================================================================

export interface PaymentTier {
  id: string;
  name: string;
  icon?: 'basic' | 'premium' | 'enterprise';
  priceWei: string;
  priceUsd: number;
  period?: 'once' | 'month' | 'year';
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  disabled?: boolean;
}

export interface TierSelectorProps {
  tiers: PaymentTier[];
  selectedTier?: string;
  onSelect: (tierId: string) => void;
  layout?: 'horizontal' | 'vertical';
  showFeatures?: boolean;
  compact?: boolean;
}

// ============================================================================
// Icon Map
// ============================================================================

const TIER_ICONS = {
  basic: Zap,
  premium: Star,
  enterprise: Crown,
} as const;

// ============================================================================
// Component
// ============================================================================

export function TierSelector({
  tiers,
  selectedTier,
  onSelect,
  layout = 'horizontal',
  showFeatures = true,
  compact = false,
}: TierSelectorProps) {
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);

  const containerClass = cn(
    'grid gap-4',
    layout === 'horizontal'
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1'
  );

  return (
    <div className={containerClass}>
      {tiers.map((tier) => {
        const Icon = tier.icon ? TIER_ICONS[tier.icon] : Sparkles;
        const isSelected = selectedTier === tier.id;
        const isHovered = hoveredTier === tier.id;

        return (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: compact ? 1 : 1.02 }}
            onHoverStart={() => setHoveredTier(tier.id)}
            onHoverEnd={() => setHoveredTier(null)}
          >
            <Card
              className={cn(
                'relative cursor-pointer transition-all duration-200',
                isSelected && 'border-primary ring-2 ring-primary/20',
                tier.highlighted && !isSelected && 'border-primary/50',
                tier.disabled && 'opacity-50 cursor-not-allowed',
                !tier.disabled && 'hover:shadow-lg'
              )}
              onClick={() => !tier.disabled && onSelect(tier.id)}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    variant={tier.highlighted ? 'default' : 'secondary'}
                    className="shadow-sm"
                  >
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className={cn(compact && 'pb-2')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1 rounded-full bg-primary text-primary-foreground"
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
                {!compact && (
                  <CardDescription className="mt-2">
                    {tier.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className={cn(compact && 'pt-0')}>
                {/* Pricing */}
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">
                    ${tier.priceUsd.toFixed(2)}
                  </span>
                  {tier.period && tier.period !== 'once' && (
                    <span className="text-muted-foreground">
                      /{tier.period}
                    </span>
                  )}
                </div>

                {!compact && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {formatUsdcPrice(tier.priceWei)} USDC
                  </p>
                )}

                {/* Features */}
                {showFeatures && !compact && tier.features.length > 0 && (
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Select Button */}
                {!compact && (
                  <Button
                    className="w-full mt-4"
                    variant={isSelected ? 'default' : 'outline'}
                    disabled={tier.disabled}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                )}
              </CardContent>

              {/* Highlight Effect */}
              {(tier.highlighted || isHovered) && !tier.disabled && (
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.05 }}
                  style={{
                    background:
                      'linear-gradient(135deg, var(--primary) 0%, transparent 60%)',
                  }}
                />
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Simple Tier Pills
// ============================================================================

export interface TierPillsProps {
  tiers: Array<{ id: string; name: string; priceUsd: number }>;
  selectedTier?: string;
  onSelect: (tierId: string) => void;
}

export function TierPills({ tiers, selectedTier, onSelect }: TierPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tiers.map((tier) => (
        <motion.button
          key={tier.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selectedTier === tier.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          )}
          onClick={() => onSelect(tier.id)}
        >
          {tier.name} - ${tier.priceUsd.toFixed(2)}
        </motion.button>
      ))}
    </div>
  );
}

export default TierSelector;
