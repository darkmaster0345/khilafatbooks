import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, FileText, Image, Percent, Check, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/currency';

interface ReferralRewardModalProps {
  open: boolean;
  onClose: () => void;
  discountAmount: number;
  onSelect: (rewardType: 'discount' | 'digital_pack') => void;
}

const ReferralRewardModal = ({ open, onClose, discountAmount, onSelect }: ReferralRewardModalProps) => {
  const [selected, setSelected] = useState<'discount' | 'digital_pack' | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    onSelect(selected);
    setTimeout(() => {
      setConfirmed(false);
      setSelected(null);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md border-primary/20 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="font-display text-lg">Welcome Reward!</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            You've used a referral code! Choose your welcome gift:
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="font-display font-bold text-foreground text-lg">Reward Applied!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selected === 'discount' ? `${formatPKR(discountAmount)} off your order` : 'Digital Scholar Pack unlocked!'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="selection" className="space-y-3 mt-2">
              {/* Digital Pack — Featured as "Premium" */}
              <button
                onClick={() => setSelected('digital_pack')}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  selected === 'digital_pack'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-foreground">Digital Scholar Pack</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        <Star className="h-2.5 w-2.5 mr-0.5" /> Premium
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Instant access to curated PDF downloads from our exclusive collection
                    </p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    selected === 'digital_pack' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selected === 'digital_pack' && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
              </button>

              {/* Discount Option */}
              <button
                onClick={() => setSelected('discount')}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  selected === 'discount'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Percent className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <span className="font-display font-bold text-sm text-foreground">5% Discount</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save {formatPKR(discountAmount)} on this order (orders over Rs. 800)
                    </p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    selected === 'discount' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selected === 'discount' && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
              </button>

              <Button
                onClick={handleConfirm}
                disabled={!selected}
                className="w-full h-11 mt-2"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Claim My Reward
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralRewardModal;
