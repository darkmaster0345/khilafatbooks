import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, BadgeCheck, Download, Truck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/currency';

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const { addItem } = useCart();

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-foreground">Product not found</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/shop"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Shop
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-lg border border-border"
        >
          <img src={product.image} alt={product.name} className="w-full object-cover aspect-square" />
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {product.isNew && <Badge className="bg-accent text-accent-foreground">New Arrival</Badge>}
            {product.type === 'digital' && (
              <Badge variant="secondary"><Download className="mr-1 h-3 w-3" /> Digital Product</Badge>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <p className="text-xs uppercase tracking-wider text-accent">{product.category}</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">{product.name}</h1>
          {product.nameAr && (
            <p className="font-arabic text-lg text-muted-foreground mt-1">{product.nameAr}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-border'}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-foreground">{formatPKR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {/* Badges */}
          <div className="mt-6 space-y-3">
            {product.isHalal && (
              <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground font-medium">Halal Certified</span>
              </div>
            )}
            {product.ethicalSource && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{product.ethicalSource}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
              {product.type === 'physical' ? (
                <><Truck className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Free shipping on orders over Rs. 5,000</span></>
              ) : (
                <><Download className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Instant digital delivery after payment approval</span></>
              )}
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => addItem(product)}
            className="mt-8 gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart — {formatPKR(product.price)}
          </Button>
        </motion.div>
      </div>
    </main>
  );
};

export default ProductDetail;
