import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPKR } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';

const ExitIntentDialog = () => {
  const [shown, setShown] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const { items, subtotal, totalItems } = useCart();

  useEffect(() => {
    if (triggered || items.length === 0) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !triggered) {
        setShown(true);
        setTriggered(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [triggered, items.length]);

  if (!shown) return null;

  return (
    <AnimatePresence>
      {shown && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setShown(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl p-7 relative">
              <button
                onClick={() => setShown(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                <ShoppingBag className="h-7 w-7 text-primary" />
              </div>

              <h3 className="font-display text-lg font-bold text-foreground text-center">
                Your cart is saved!
              </h3>
              <p className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
                You have <strong>{totalItems} item{totalItems > 1 ? 's' : ''}</strong> worth{' '}
                <strong className="text-foreground">{formatPKR(subtotal)}</strong> waiting for you. Come back anytime!
              </p>

              <Button
                onClick={() => setShown(false)}
                className="w-full mt-5 h-11"
              >
                Continue Shopping
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentDialog;
