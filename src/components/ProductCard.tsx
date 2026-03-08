import { Link } from 'react-router-dom';
import { ShoppingCart, Download, Star, BadgeCheck, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { LegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/currency';

const ProductCard = ({ product, index = 0 }: { product: LegacyProduct; index?: number }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.reviews >= 15 && (
            <Badge className="bg-accent text-accent-foreground text-[10px] font-semibold shadow-md">🔥 Bestseller</Badge>
          )}
          {product.rating >= 4.5 && product.reviews < 15 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold shadow-md">⭐ Top Rated</Badge>
          )}
          {product.isNew && (
            <Badge className="bg-accent text-accent-foreground text-[10px] font-semibold shadow-md">New</Badge>
          )}
          {product.type === 'digital' && (
            <Badge variant="secondary" className="text-[10px] shadow-md backdrop-blur-md bg-secondary/90">
              <Download className="mr-1 h-3 w-3" /> Digital
            </Badge>
          )}
          {product.isHalal && (
            <Badge variant="outline" className="bg-background/90 text-[10px] backdrop-blur-md shadow-md">
              <BadgeCheck className="mr-1 h-3 w-3 text-primary" /> Halal
            </Badge>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 ${
            isWishlisted
              ? 'bg-destructive text-destructive-foreground shadow-lg scale-110'
              : 'bg-background/50 text-foreground hover:bg-background/90 hover:scale-110'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {product.originalPrice && (
          <div className="absolute right-3 bottom-3">
            <Badge className="gold-gradient text-primary-foreground text-[10px] border-0 font-bold shadow-lg px-2.5 py-1">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
            </Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 pt-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="mt-1.5 font-display text-[15px] font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        {product.nameAr && (
          <p className="font-arabic text-xs text-muted-foreground mt-1">{product.nameAr}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5">
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
            className="h-9 gap-1.5 text-xs rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
