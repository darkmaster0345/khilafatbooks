import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Star, Truck, Shield, BadgeCheck, StarHalf, Users,
  ArrowLeft, Share2, Link2, Download, Gift, Bell, AlertTriangle, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { formatPKR } from '@/lib/currency';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';
import RecentlyViewed from '@/components/RecentlyViewed';
import StickyAddToCart from '@/components/StickyAddToCart';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import SmartSuggest from '@/components/SmartSuggest';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ProductSkeleton from '@/components/ProductSkeleton';
import { ProductJsonLd as JsonLd } from '@/components/JsonLd';

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, loading } = useProducts();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const addToCartRef = useRef<HTMLButtonElement>(null);

  const found = products.find(p => p.name.toLowerCase().replace(/ /g, '-') === slug);
  const product = found ? toLegacyProduct(found) : null;
  const relatedProducts = products
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .map(toLegacyProduct)
    .slice(0, 4);

  useEffect(() => {
    if (product) {
      import('@/lib/analytics').then(m => m.trackViewContent(product));
      setActiveImage(product.image);
    }
  }, [product]);

  if (loading) return <div className="container mx-auto px-4 py-12"><ProductSkeleton /></div>;
  if (!product) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <Button asChild className="mt-4"><Link to="/shop">Back to Shop</Link></Button>
    </div>
  );

  const viewerCount = Math.floor(Math.random() * 15) + 3;
  const soldCount = Math.floor(Math.random() * 150) + 20;

  const galleryImages = [product.image, ...(product.imageUrls || [])].filter(Boolean);

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <JsonLd
        name={product.name}
        description={product.description}
        image={product.image}
        price={product.price}
        category={product.category}
        inStock={product.inStock}
        rating={product.rating}
        reviewCount={product.reviews}
      />
      <div className="mb-8">
        <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-primary">
          <Link to="/shop"><ArrowLeft className="h-4 w-4" /> Back to Shop</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={activeImage || '/placeholder.svg'}
                alt={product.name}
                className="h-full w-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            {product.isNew && (
              <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground border-0 px-3 py-1 text-xs font-bold shadow-sm">NEW</Badge>
            )}
            {product.type === 'digital' && (
              <Badge className="absolute right-4 top-4 shadow-sm bg-primary/10 text-primary border-primary/20"><Download className="mr-1 h-3 w-3" /> Instant Digital Delivery</Badge>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${activeImage === img ? 'border-primary shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`${product.name} gallery ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          <p className="section-heading">{product.category}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">{product.name}</h1>
          {product.nameAr && (
            <p className="font-amiri text-xl text-muted-foreground mt-1" dir="rtl">{product.nameAr}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-border'}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
            {soldCount > 0 && (
              <>
                <span className="text-border mx-1">•</span>
                <span className="text-sm font-medium text-accent">{soldCount} sold</span>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-accent" />
            <span>{viewerCount} people are viewing this right now</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <div className="flex flex-col">
              <span className="font-display text-4xl font-extrabold text-foreground tracking-tight">
                {formatPKR(product.price)}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Approx. $(product.price / 280).toFixed(2) USD
              </span>
            </div>
            {product.originalPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
                <Badge className="gold-gradient text-primary-foreground border-0 text-xs">
                  Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Badge>
              </>
            )}
          </div>

          {!product.inStock && (
            <div className="mt-3 space-y-4">
              <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                <AlertTriangle className="h-4 w-4" /> Out of stock
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={notifyRequested}
                onClick={async () => {
                  if (!user) {
                    toast({ title: 'Sign in required', description: 'Please sign in to get notified.', variant: 'destructive' });
                    return;
                  }
                  const { error } = await supabase.from('stock_notifications').insert({
                    user_id: user.id,
                    product_id: product.id,
                    user_email: user.email,
                  } as any);
                  if (error?.code === '23505') {
                    toast({ title: 'Already subscribed', description: "You'll be notified when this is back in stock." });
                  } else if (error) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  } else {
                    toast({ title: 'Subscribed!', description: "We'll notify you when this product is back in stock." });
                  }
                  setNotifyRequested(true);
                }}
              >
                <Bell className="h-4 w-4" />
                {notifyRequested ? 'Notification Set ✓' : 'Notify Me When Available'}
              </Button>
              <SmartSuggest 
                reason="out_of_stock"
                category={found?.category}
                series={(found as any)?.series || undefined}
                excludeId={product.id}
                limit={3}
              />
            </div>
          )}

          <div className="mt-5">
            <p className={`text-sm leading-relaxed text-muted-foreground ${!expanded ? 'line-clamp-4' : ''}`}>
              {product.description}
            </p>
            {!expanded && product.description.length > 200 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-primary text-sm font-semibold mt-2 hover:underline"
              >
                Read more
              </button>
            )}
          </div>

          <div className="mt-7 space-y-2.5">
            {product.isHalal && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground font-medium">Halal Certified</span>
              </div>
            )}
            {product.ethicalSource && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
                <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{product.ethicalSource}</span>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
              {product.type === 'physical' ? (
                <><Truck className="h-5 w-5 text-muted-foreground shrink-0" /><span className="text-sm text-muted-foreground">Delivery: {product.deliveryFee > 0 ? `Rs. ${product.deliveryFee.toLocaleString()}` : 'Free'}</span></>
              ) : (
                <><Download className="h-5 w-5 text-primary shrink-0" /><span className="text-sm text-foreground font-medium">✨ Free Instant Delivery — delivered to your email & Library</span></>
              )}
            </div>
          </div>

          <Button
            ref={addToCartRef}
            size="lg"
            onClick={() => addItem(product)}
            disabled={!product.inStock}
            className="mt-9 gap-2.5 h-13 text-base rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <ShoppingCart className="h-5 w-5" />
            {product.inStock ? `Add to Cart — ${formatPKR(product.price)}` : 'Out of Stock'}
          </Button>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Share:</span>
            <button
              onClick={() => {
                const url = `${window.location.origin}/books/${product.slug}`;
                const text = `Asalam-o-Alaikum! Check out "${product.name}" on Khilafat Books! PKR ${product.price}\n\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                import('@/lib/analytics').then(m => m.trackShare(product, 'whatsapp'));
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#128C7E] shadow-md transition-all active:scale-95"
              aria-label="Share on WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/books/${product.slug}`;
                navigator.clipboard.writeText(url);
                toast({ title: 'Link copied!', description: 'Product link copied to clipboard.' });
              }}
              className="flex h-auto items-center gap-1.5 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors px-3 py-2 text-xs"
              aria-label="Copy product link"
            >
              <Link2 className="h-3.5 w-3.5" />
              Copy Link
            </button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs rounded-xl"
              onClick={() => {
                addItem(product);
                toast({
                  title: '🎁 Gift this product!',
                  description: 'Added to cart. Toggle "Send as Gift" at checkout to add a message & gift wrap.',
                });
              }}
            >
              <Gift className="h-3.5 w-3.5" />
              Gift This
            </Button>
          </div>
        </motion.div>
      </div>

      <ProductReviews productId={product.id} productRating={product.rating} productReviews={product.reviews} />
      <RecentlyViewed excludeId={product.id} />

      {relatedProducts.length > 0 && (
        <section className="mt-24 border-t border-border pt-16">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground">You May Also Like</h2>
            <p className="text-sm text-muted-foreground mt-1">Based on the category "{product.category}"</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <StickyAddToCart product={product} triggerRef={addToCartRef} />
    </main>
  );
};

export default ProductDetail;
