import { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatPKR } from '@/lib/currency';
import { LegacyProduct } from '@/hooks/useProducts';
import LeadCaptureModal from './LeadCaptureModal';

interface StickyAddToCartProps {
  product: LegacyProduct;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const StickyAddToCart = ({ product, triggerRef }: StickyAddToCartProps) => {
  const [showSticky, setShowSticky] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only show sticky if the main "Notify Me" button is NOT visible
        setShowSticky(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => {
      if (triggerRef.current) {
        observer.unobserve(triggerRef.current);
      }
    };
  }, [triggerRef]);

  return (
    <>
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-md border-t border-border shadow-2xl z-40 md:hidden flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">{product.name}</p>
              <p className="text-sm font-bold text-foreground">{formatPKR(product.price)}</p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="flex-[2] h-12 text-sm font-bold rounded-xl shadow-lg active:scale-95 transition-transform gold-gradient border-0 text-foreground"
            >
              <BellRing className="mr-2 h-4 w-4" />
              Notify Me
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadCaptureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={{ id: product.id, name: product.name }}
      />
    </>
  );
};

export default StickyAddToCart;
