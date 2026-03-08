import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/currency';

interface Props {
  product: LegacyProduct;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const StickyAddToCart = ({ product, triggerRef }: Props) => {
  const [visible, setVisible] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    const el = triggerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [triggerRef]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md p-3 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
              <p className="text-sm font-bold text-primary">{formatPKR(product.price)}</p>
            </div>
            <Button onClick={() => addItem(product)} className="gap-2 shrink-0 h-11 rounded-xl shadow-md">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
