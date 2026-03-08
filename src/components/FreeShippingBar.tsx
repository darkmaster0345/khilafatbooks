import { Truck, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatPKR } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';

const FREE_SHIPPING_THRESHOLD = 5000;

const FreeShippingBar = ({ subtotal }: { subtotal: number }) => {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const unlocked = remaining === 0;

  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      unlocked ? 'border-primary/20 bg-primary/5' : 'border-accent/20 bg-accent/5'
    }`}>
      <AnimatePresence mode="wait">
        {unlocked ? (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5"
          >
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-medium text-primary">
              You've unlocked <strong>FREE shipping!</strong> 🎉
            </p>
          </motion.div>
        ) : (
          <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-2.5">
              <Truck className="h-4 w-4 text-accent shrink-0" />
              <p className="text-sm text-foreground">
                Add <strong className="text-accent">{formatPKR(remaining)}</strong> more for <strong>FREE shipping!</strong>
              </p>
            </div>
            <Progress value={progress} className="h-2 bg-accent/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FreeShippingBar;
