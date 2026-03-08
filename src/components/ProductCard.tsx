import { Link } from 'react-router-dom';
import { ShoppingCart, Download, Star, BadgeCheck, Heart, Eye, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { LegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/currency';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const ProductCard = ({ product, index = 0 }: { product: LegacyProduct; index?: number }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [justAdded, setJustAdded] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={cardVariants}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2"
    >
      {/* Image area */}
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-[0.92]"
          loading="lazy"
        />

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400" />

        {/* Quick action buttons - appear on hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out">
          <Button
            onClick={handleAddToCart}
            size="sm"
            className={`flex-1 h-10 gap-2 text-xs font-semibold rounded-xl backdrop-blur-md shadow-lg transition-all ${
              justAdded
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/90 text-foreground hover:bg-background'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {justAdded ? 'Added ✓' : 'Quick Add'}
          </Button>
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-10 w-10 p-0 rounded-xl backdrop-blur-md bg-background/90 hover:bg-background shadow-lg"
          >
            <Link to={`/product/${product.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {/* Badges */}
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

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 ${
            isWishlisted
              ? 'bg-destructive text-destructive-foreground shadow-lg scale-110'
              : 'bg-background/60 text-foreground opacity-0 group-hover:opacity-100 hover:bg-background/90 hover:scale-110'
          }`}
        >
          <Heart className={`h-4 w-4 transition-transform ${isWishlisted ? 'fill-current scale-110' : 'group-hover:scale-100'}`} />
        </button>

        {/* Discount badge */}
        {product.originalPrice && (
          <div className="absolute right-3 bottom-3 group-hover:bottom-16 transition-all duration-400">
            <Badge className="gold-gradient text-primary-foreground text-[10px] border-0 font-bold shadow-lg px-2.5 py-1">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
            </Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
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
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50 mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-foreground">{formatPKR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
            )}
          </div>
          {/* Mobile-only add button (hover overlay hidden on touch) */}
          <Button
            size="sm"
            onClick={handleAddToCart}
            className="h-9 gap-1.5 text-xs rounded-xl shadow-sm hover:shadow-md transition-all md:hidden"
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
