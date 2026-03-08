import { motion } from 'framer-motion';
import { Award, Star, Crown, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCart, LoyaltyTier } from '@/context/CartContext';
import { formatPKR } from '@/lib/currency';

const TIER_CONFIG: Record<LoyaltyTier, { 
  label: string; 
  labelAr: string;
  icon: any; 
  color: string; 
  bgColor: string;
  discount: number;
  description: string;
}> = {
  talib: { 
    label: 'Talib', 
    labelAr: 'طالب',
    icon: Star, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    discount: 0,
    description: 'Student of Knowledge',
  },
  muallim: { 
    label: 'Muallim', 
    labelAr: 'معلم',
    icon: Award, 
    color: 'text-accent', 
    bgColor: 'bg-accent/10',
    discount: 2,
    description: 'Teacher • 2% discount',
  },
  alim: { 
    label: 'Alim', 
    labelAr: 'عالم',
    icon: Crown, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10',
    discount: 5,
    description: 'Scholar • 5% discount',
  },
};

const TIER_THRESHOLDS = {
  muallim: 2000,
  alim: 10000,
};

interface LoyaltyBadgeProps {
  compact?: boolean;
}

const LoyaltyBadge = ({ compact = false }: LoyaltyBadgeProps) => {
  const { loyaltyInfo } = useCart();

  if (!loyaltyInfo) return null;

  const config = TIER_CONFIG[loyaltyInfo.tier];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        {config.discount > 0 && (
          <span className="text-xs bg-background/50 px-1.5 py-0.5 rounded-full">
            {config.discount}% off
          </span>
        )}
      </div>
    );
  }

  const amountToNextTier = loyaltyInfo.nextTierThreshold - loyaltyInfo.totalSpent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-display text-lg font-bold ${config.color}`}>
                {config.label}
              </h3>
              <span className={`font-arabic text-sm ${config.color}`}>{config.labelAr}</span>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
        {config.discount > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold font-display text-primary">{config.discount}%</p>
            <p className="text-xs text-muted-foreground">Discount</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-border/50">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Spent</p>
          <p className="font-display font-bold text-foreground">{formatPKR(loyaltyInfo.totalSpent)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Tier</p>
          <p className="font-display font-bold text-foreground capitalize">{loyaltyInfo.tier}</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {loyaltyInfo.nextTier && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Progress to {TIER_CONFIG[loyaltyInfo.nextTier].label}
            </span>
            <span className="font-medium text-foreground">{Math.round(loyaltyInfo.progress)}%</span>
          </div>
          <Progress value={loyaltyInfo.progress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            Spend <span className="font-semibold text-primary">{formatPKR(amountToNextTier)}</span> more to unlock{' '}
            <span className="font-semibold">{TIER_CONFIG[loyaltyInfo.nextTier].label}</span> tier 
            ({TIER_CONFIG[loyaltyInfo.nextTier].discount}% discount)
          </p>
        </div>
      )}

      {!loyaltyInfo.nextTier && (
        <div className="flex items-center gap-2 text-primary">
          <Crown className="h-5 w-5" />
          <p className="text-sm font-medium">You've reached the highest tier! 🎉</p>
        </div>
      )}
    </motion.div>
  );
};

export default LoyaltyBadge;
