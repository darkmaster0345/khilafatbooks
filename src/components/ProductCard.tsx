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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-accent text-accent-foreground text-[10px]">New</Badge>
          )}
          {product.type === 'digital' && (
            <Badge variant="secondary" className="text-[10px]">
              <Download className="mr-1 h-3 w-3" /> Digital
            </Badge>
          )}
          {product.isHalal && (
            <Badge variant="outline" className="bg-background/80 text-[10px]">
              <BadgeCheck className="mr-1 h-3 w-3 text-primary" /> Halal
            </Badge>
          )}
        </div>
        {product.originalPrice && (
          <div className="absolute right-2 top-2">
            <Badge className="gold-gradient text-primary-foreground text-[10px] border-0">
              {Math.round((1 - product.price / product.originalPrice) * 100)}% Off
            </Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="mt-1 font-display text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.nameAr && (
          <p className="font-arabic text-xs text-muted-foreground mt-0.5">{product.nameAr}</p>
        )}
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3 w-3 fill-accent text-accent" />
          <span className="text-xs text-muted-foreground">{product.rating} ({product.reviews})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-foreground">{formatPKR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            className="h-8 gap-1 text-xs"
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
