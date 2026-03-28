import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';
import { productSchema } from '@/lib/seo-schemas';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, ShoppingCart, Truck, Download, Heart,
  ArrowLeft, Share2, ShieldCheck, AlertTriangle,
  Bell, CheckCircle2, Users, BadgeCheck, Gift, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProductReviews from '@/components/ProductReviews';
import RecentlyViewed from '@/components/RecentlyViewed';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import SmartSuggest from '@/components/SmartSuggest';
import StickyAddToCart from '@/components/StickyAddToCart';
import WhatsAppIcon from '@/components/WhatsAppIcon';

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, loading } = useProducts();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const addToCartRef = useRef<HTMLButtonElement>(null);

  const found = products.find(p => p.slug === slug);
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
  if (!product) {
    return (
      <main className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button asChild className="mt-4"><Link to="/shop">Back to Shop</Link></Button>
      </main>
    );
  }

  const viewerCount = Math.floor(Math.random() * 15) + 3;
  const soldCount = Math.floor(Math.random() * 150) + 20;
  const galleryImages = [product.image, ...(product.imageUrls || [])].filter(Boolean);

  return (
    <>
      <SEOHead
        title={`${product.name} ${product.author ? `by ${product.author}` : ""} | Khilafat Books`}
        description={product.description?.slice(0, 150) ?? `Buy ${product.name} at Khilafat Books. Authentic Islamic literature. Fast delivery across Pakistan.`}
        canonical={`/books/${product.slug}`}
        ogImage={product.image}
        ogType="product"
        jsonLd={productSchema({
          name: product.name,
          author: product.author,
          description: product.description,
          image_url: product.image,
          price: product.price,
          slug: product.slug,
          inStock: product.inStock,
          publisher: product.publisher
        })}
      />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumb crumbs={[
          { label: "Home", href: "/" },
          { label: product.category, href: `/shop?category=${product.category}` },
          { label: product.name, href: `/books/${product.slug}` }
        ]} />

        <div className="mb-8">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-primary">
            <Link to="/shop"><ArrowLeft className="h-4 w-4" /> Back to Shop</Link>
          </Button>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-card border border-border shadow-md">
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500"
                fetchpriority="high"
                loading="eager"
                decoding="sync"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square rounded-xl border-2 transition-all overflow-hidden ${activeImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`${product.name} gallery ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            <p className="section-heading text-primary font-bold uppercase tracking-widest text-[10px] mb-2">{product.category}</p>
            <h1 className="font-display text-3xl md:text-5xl font-black text-foreground leading-tight">{product.name}</h1>

            {product.nameAr && (
              <p className="font-amiri text-2xl text-muted-foreground mt-2" dir="rtl">{product.nameAr}</p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">{product.rating} ({product.reviews} reviews)</span>
              <span className="h-4 w-px bg-border mx-1" />
              <span className="text-sm font-bold text-accent">{soldCount} Sold</span>
            </div>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="font-display text-5xl font-black text-foreground">{formatPKR(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through opacity-50">{formatPKR(product.originalPrice)}</span>
                  <Badge className="bg-primary/10 text-primary border-0 font-bold">Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</Badge>
                </>
              )}
            </div>

            {!product.inStock && (
              <div className="mt-6 p-6 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-4">
                <div className="flex items-center gap-2 text-destructive font-bold">
                  <AlertTriangle className="h-5 w-5" /> Out of Stock
                </div>
                <Button
                  variant="outline"
                  disabled={notifyRequested}
                  onClick={() => {
                    toast({ title: 'Subscribed!', description: "We'll notify you when this is back." });
                    setNotifyRequested(true);
                  }}
                  className="w-full gap-2 rounded-xl"
                >
                  <Bell className="h-4 w-4" /> {notifyRequested ? 'Notification Set' : 'Notify Me'}
                </Button>
                <SmartSuggest reason="out_of_stock" category={product.category} excludeId={product.id} limit={2} />
              </div>
            )}

            <div className="mt-8">
              <p className={`text-muted-foreground leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
                {product.description}
              </p>
              {!expanded && product.description.length > 250 && (
                <button onClick={() => setExpanded(true)} className="text-primary font-bold text-sm mt-3 hover:underline">Read full description</button>
              )}
            </div>

            <div className="mt-10 space-y-3">
              {product.isHalal && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold">Halal Certified</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                {product.type === 'physical' ? (
                  <><Truck className="h-5 w-5 text-muted-foreground" /><span className="text-sm">Delivery: {product.deliveryFee > 0 ? formatPKR(product.deliveryFee) : 'FREE'}</span></>
                ) : (
                  <><Download className="h-5 w-5 text-primary" /><span className="text-sm font-bold">Instant Digital Access</span></>
                )}
              </div>
            </div>

            <Button
              ref={addToCartRef}
              size="lg"
              onClick={() => addItem(product)}
              disabled={!product.inStock}
              className="mt-10 h-14 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart — {formatPKR(product.price)}
            </Button>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  const url = window.location.href;
                  const text = `Check out this book on Khilafat Books: ${product.name}\n\n${url}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#128C7E] transition-colors"
              >
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp
              </button>
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: 'Link copied!' });
                }}
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-2 px-4 rounded-xl"
                onClick={() => {
                   addItem(product);
                   toast({ title: 'Gift added!', description: 'Toggle "Send as Gift" at checkout.' });
                }}
              >
                <Gift className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        <ProductReviews productId={product.id} productRating={product.rating} productReviews={product.reviews} />
        <RecentlyViewed excludeId={product.id} />

        {relatedProducts.length > 0 && (
          <section className="mt-24 pt-16 border-t border-border">
            <div className="mb-10">
              <h2 className="font-display text-3xl font-bold">You May Also Like</h2>
              <p className="text-muted-foreground mt-2">More from "{product.category}"</p>
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
    </>
  );
};

export default ProductDetail;
