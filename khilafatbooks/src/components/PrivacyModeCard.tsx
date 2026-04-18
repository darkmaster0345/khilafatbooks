import { useState } from 'react';
import { Shield, ShieldCheck, Lock, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { toast } from 'sonner';
import { PRIVACY_FEE } from '@/lib/constants';


const PrivacyModeCard = () => {
  const { user } = useAuth();
  const { privacyMode, privacyPaid, loading, activatePrivacy, deactivatePrivacy } = usePrivacyMode();
  const [activating, setActivating] = useState(false);

  if (!user || loading) return null;

  const handleActivate = async () => {
    setActivating(true);
    const success = await activatePrivacy();
    setActivating(false);
    if (success) {
      toast.success('🔒 Privacy Mode activated!', {
        description: 'Your order data will be auto-deleted 30 days after delivery.',
      });
    } else {
      toast.error('Failed to activate Privacy Mode');
    }
  };

  const handleDeactivate = async () => {
    const success = await deactivatePrivacy();
    if (success) {
      toast.success('Privacy Mode deactivated', {
        description: 'Your order history will be preserved.',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-6 transition-colors ${
        privacyMode
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
          privacyMode ? 'bg-primary/15' : 'bg-muted'
        }`}>
          {privacyMode ? (
            <ShieldCheck className="h-6 w-6 text-primary" />
          ) : (
            <Shield className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg font-bold text-foreground">
              Privacy Mode
            </h3>
            {privacyMode && (
              <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">
                <Lock className="h-2.5 w-2.5 mr-1" /> Active
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Your data sovereignty, guaranteed. When active:
          </p>

          <ul className="mt-3 space-y-2">
            {[
              { icon: Trash2, text: 'Order history auto-deleted 30 days after delivery' },
              { icon: EyeOff, text: 'Cart activity tracking disabled' },
              { icon: Lock, text: 'Your browsing data stays private' },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                {item.text}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center gap-3">
            {privacyMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                className="rounded-xl"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Deactivate Privacy Mode
              </Button>
            ) : (
              <Button
                onClick={handleActivate}
                disabled={activating}
                size="sm"
                className="rounded-xl gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                {activating ? 'Activating...' : privacyPaid ? 'Re-activate Privacy Mode' : `Activate for ${formatPKR(PRIVACY_FEE)}`}
              </Button>
            )}

            {!privacyPaid && !privacyMode && (
              <span className="text-[10px] text-muted-foreground">
                One-time fee • Lifetime access
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyModeCard;
