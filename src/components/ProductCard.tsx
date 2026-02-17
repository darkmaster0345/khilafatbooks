import { Link } from 'react-router-dom';
import { ShoppingCart, Download, Star, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { LegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/currency';

const ProductCard = ({ product, index = 0 }: { product: LegacyProduct; index?: number }) => {
  const { addItem } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card hover-lift"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
          loading="lazy"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
        
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {product.isNew && (
            <Badge className="bg-accent text-accent-foreground text-[10px] font-semibold shadow-sm">New</Badge>
          )}
          {product.type === 'digital' && (
            <Badge variant="secondary" className="text-[10px] shadow-sm backdrop-blur-sm">
              <Download className="mr-1 h-3 w-3" /> Digital
            </Badge>
          )}
          {product.isHalal && (
            <Badge variant="outline" className="bg-background/85 text-[10px] backdrop-blur-sm shadow-sm">
              <BadgeCheck className="mr-1 h-3 w-3 text-primary" /> Halal
            </Badge>
          )}
        </div>
        {product.originalPrice && (
          <div className="absolute right-2.5 top-2.5">
            <Badge className="gold-gradient text-primary-foreground text-[10px] border-0 font-semibold shadow-sm">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="mt-1 font-display text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        {product.nameAr && (
          <p className="font-arabic text-xs text-muted-foreground mt-0.5">{product.nameAr}</p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-border'}`} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50 mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-foreground">{formatPKR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            className="h-8 gap-1.5 text-xs rounded-lg shadow-sm"
          >
            <ShoppingCart className="h-3 w-3" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
