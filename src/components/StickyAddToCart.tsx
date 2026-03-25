import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Download, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatPKR } from '@/lib/currency';
import { LegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import WhatsAppIcon from './WhatsAppIcon';

interface StickyAddToCartProps {
  product: LegacyProduct;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const StickyAddToCart = ({ product, triggerRef }: StickyAddToCartProps) => {
  const [showSticky, setShowSticky] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
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

  const getCTALabel = () => {
    if (!product.inStock) return 'Out of Stock';
    if (product.type === 'digital' || product.category?.toLowerCase().includes('course')) {
      return `Buy Now — ${formatPKR(product.price)}`;
    }
    if (product.price === 0) return 'Order on WhatsApp';
    return `Add to Cart — ${formatPKR(product.price)}`;
  };

  const handleCTA = () => {
    if (product.price === 0) {
      const url = `${window.location.origin}/books/${product.slug}`;
      const text = `Asalam-o-Alaikum, I'd like to order "${product.name}" (Free). ${url}`;
      window.open(`https://wa.me/923352706540?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }
    addItem(product);
  };

  return (
    <AnimatePresence>
      {showSticky && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-md border-t border-border shadow-2xl z-50 md:hidden flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{product.name}</p>
            <p className="text-sm font-bold text-foreground">{formatPKR(product.price)}</p>
          </div>
          <Button
            onClick={handleCTA}
            disabled={!product.inStock}
            className="flex-[2] h-12 text-sm font-bold rounded-xl shadow-lg active:scale-95 transition-transform gold-gradient border-0 text-foreground"
          >
            {product.price === 0 ? <WhatsAppIcon className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            {getCTALabel()}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
