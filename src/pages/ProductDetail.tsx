import { useParams, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShoppingCart, Star, BadgeCheck, Download, Truck, Shield, Users, AlertTriangle, Share2, MessageCircle, Copy, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';
import RecentlyViewed from '@/components/RecentlyViewed';
import StickyAddToCart from '@/components/StickyAddToCart';
import SmartSuggest from '@/components/SmartSuggest';
import { ProductJsonLd } from '@/components/JsonLd';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ProductDetail = () => {
  const { id } = useParams();
  const { products, loading } = useProducts();
  const found = products.find(p => p.id === id);
  const product = found ? toLegacyProduct(found) : null;
  const { addItem } = useCart();
  const { addProduct } = useRecentlyViewed();
  const { toast } = useToast();
  const { user } = useAuth();
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const [notifyRequested, setNotifyRequested] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (product) addProduct(product);
  }, [product?.id]);

  // Social proof: random viewers (seeded by product id for consistency)
  const viewerCount = product ? 3 + (product.id.charCodeAt(0) % 12) : 0;

  const relatedProducts = products
    .filter(p => p.id !== id && p.category === found?.category)
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 4)
    .map(toLegacyProduct);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-xl bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-10 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-lg mx-auto text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground text-sm">This product may have been removed or doesn't exist.</p>
        </div>
        <div className="max-w-lg mx-auto">
          <SmartSuggest reason="removed" limit={3} />
        </div>
        <div className="text-center mt-6">
          <Button asChild variant="outline">
            <Link to="/shop"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <Helmet>
        <title>{product.name} | Khilafat Books</title>
        <meta name="description" content={`${product.description.slice(0, 150)}${product.description.length > 150 ? '...' : ''}`} />
        <link rel="canonical" href={`https://khilafatbooks.lovable.app/product/${product.id}`} />
      </Helmet>
      <ProductJsonLd
        name={product.name}
        description={product.description}
        image={product.image}
        price={product.price}
        rating={product.rating}
        reviewCount={product.reviews}
        inStock={product.inStock}
        sku={product.id}
      />

      <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group">
        <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-muted"
        >
          <img src={product.image} alt={product.name} className="w-full object-cover aspect-square" />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNew && <Badge className="bg-accent text-accent-foreground shadow-sm">New Arrival</Badge>}
            {product.type === 'digital' && (
              <Badge variant="secondary" className="shadow-sm"><Download className="mr-1 h-3 w-3" /> Digital Product</Badge>
            )}
          </div>
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
            <p className="font-arabic text-xl text-muted-foreground mt-1">{product.nameAr}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-border'}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
          </div>

          {/* Social proof */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-accent" />
            <span>{viewerCount} people are viewing this right now</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-foreground">{formatPKR(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
                <Badge className="gold-gradient text-primary-foreground border-0 text-xs">
                  Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Badge>
              </>
            )}
          </div>

          {/* Stock urgency */}
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

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

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
                <><Truck className="h-5 w-5 text-muted-foreground shrink-0" /><span className="text-sm text-muted-foreground">Free shipping on orders over Rs. 5,000</span></>
              ) : (
                <><Download className="h-5 w-5 text-muted-foreground shrink-0" /><span className="text-sm text-muted-foreground">Instant digital delivery after payment approval</span></>
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

          {/* Social Sharing */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Share:</span>
            <button
              onClick={() => {
                const url = `https://khilafatbooks.lovable.app/product/${product.id}`;
                const text = `Check out "${product.name}" on Khilafat Books! ${formatPKR(product.price)}\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
              aria-label="Share on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const url = `https://khilafatbooks.lovable.app/product/${product.id}`;
                navigator.clipboard.writeText(url);
                toast({ title: 'Link copied!', description: 'Product link copied to clipboard.' });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="Copy product link"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={product.id} productRating={product.rating} productReviews={product.reviews} />

      {/* Recently Viewed */}
      <RecentlyViewed excludeId={product.id} />

      {/* Related Products */}
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

      {/* Sticky Mobile Add to Cart */}
      <StickyAddToCart product={product} triggerRef={addToCartRef} />
    </main>
  );
};

export default ProductDetail;
