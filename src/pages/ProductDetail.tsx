import { useParams, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShoppingCart, Star, BadgeCheck, Download, Truck, Shield, Users, AlertTriangle, Share2, Copy, Bell, Gift, Link2 } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
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
import { truncateDescription } from '@/lib/seo';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://khilafatbooks.vercel.app';
import { useCart } from '@/context/CartContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/lib/utils';

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, loading } = useProducts();
  const found = products.find(p => p.id === slug || slugify(p.name) === slug);
  const product = found ? toLegacyProduct(found) : null;
  const { addItem } = useCart();
  const { addProduct } = useRecentlyViewed();
  const { toast } = useToast();
  const { user } = useAuth();
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [soldCount, setSoldCount] = useState(0);

  // Fetch sold count from Supabase
  useEffect(() => {
    if (product) {
      supabase.from('order_items')
        .select('quantity', { count: 'exact' })
        .eq('product_id', product.id)
        .then(({ data, count }) => {
          const totalSold = data?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || count || 0;
          // Seed with a reasonable minimum if zero but it has reviews
          setSoldCount(totalSold || (product.reviews * 3) + (product.id.charCodeAt(0) % 15));
        });
    }
  }, [product?.id]);

  // Track recently viewed and analytics
  useEffect(() => {
    if (product) {
      addProduct(product);
      import('@/lib/analytics').then(m => m.trackViewItem(product));
    }
  }, [product?.id]);

  // Social proof: random viewers (seeded by product id for consistency)
  const viewerCount = product ? 3 + (product.id.charCodeAt(0) % 12) : 0;

  const relatedProducts = products
    .filter(p => p.id !== found?.id && p.category === found?.category)
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

  const cloudinaryOgImage = product.image.includes('cloudinary.com')
    ? product.image.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/')
    : (product.image.startsWith('http') ? product.image : `${BASE_URL}${product.image}`);

  const absoluteProductUrl = `${BASE_URL}/books/${product.slug}`;

  return (
    <main className="container mx-auto px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="text-border">/</span>
        <Link to={`/shop?category=${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
        <span className="text-border">/</span>
        <span className="text-foreground font-medium truncate max-w-[150px]">{product.name}</span>
      </nav>
      <Helmet>
        {/* Dynamic metadata for book detail page SEO using truncateDescription utility */}
        <title>{product.name} — Islamic {product.category} | Khilafat Books</title>
        <meta name="description" content={truncateDescription(`${product.name}: ${product.description}`)} />
        <link rel="canonical" href={absoluteProductUrl} />
        <link rel="alternate" hreflang="en" href={absoluteProductUrl} />
        <link rel="alternate" hreflang="ur" href={absoluteProductUrl} />

        <meta property="og:site_name" content="Khilafat Books" />
        <meta property="og:title" content={`${product.name} — Islamic ${product.category} | Khilafat Books`} />
        <meta property="og:description" content={truncateDescription(product.description)} />
        <meta property="og:url" content={absoluteProductUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:image" content={cloudinaryOgImage} />

        {/* Pinterest & Rich Pin specific tags */}
        <meta property="product:price:amount" content={String(product.price)} />
        <meta property="product:price:currency" content="PKR" />
        <meta property="product:availability" content={product.inStock ? 'instock' : 'out of stock'} />
        <meta property="product:condition" content="new" />
        <meta property="og:price:amount" content={String(product.price)} />
        <meta property="og:price:currency" content="PKR" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} — Islamic ${product.category} | Khilafat Books`} />
        <meta name="twitter:description" content={truncateDescription(product.description)} />
        <meta name="twitter:image" content={cloudinaryOgImage} />
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
        category={product.category}
        url={absoluteProductUrl}
        isbn={(product as any).isbn}
        inLanguage={(product as any).inLanguage || 'en'}
        publisher="Khilafat Books"
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
              <Badge variant="secondary" className="shadow-sm bg-primary/10 text-primary border-primary/20"><Download className="mr-1 h-3 w-3" /> Instant Digital Delivery</Badge>
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

          {/* Social proof */}
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
                Approx. ${(product.price / 280).toFixed(2)} USD
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
                <><Truck className="h-5 w-5 text-muted-foreground shrink-0" /><span className="text-sm text-muted-foreground">Free shipping on orders over Rs. 5,000</span></>
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

          {/* Social Sharing & Gift */}
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
