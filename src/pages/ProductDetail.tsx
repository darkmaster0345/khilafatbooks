import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, BadgeCheck, Download, Truck, Shield, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/currency';

const ProductDetail = () => {
  const { id } = useParams();
  const { products, loading } = useProducts();
  const found = products.find(p => p.id === id);
  const product = found ? toLegacyProduct(found) : null;
  const { addItem } = useCart();

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
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">Product not found</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/shop"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
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
            size="lg"
            onClick={() => addItem(product)}
            className="mt-9 gap-2.5 h-13 text-base rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart — {formatPKR(product.price)}
          </Button>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <section className="mt-20 border-t border-border pt-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">Customer Reviews</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-lg font-bold text-foreground">{product.rating} out of 5</span>
              <span className="text-sm text-muted-foreground">Based on {product.reviews} reviews</span>
            </div>
          </div>
          <Button className="gap-2">
            <MessageSquare className="h-4 w-4" /> Write a Review
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Review Summary Mockup */}
          <div className="lg:col-span-1 space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const percentages = { 5: 85, 4: 10, 3: 3, 2: 1, 1: 1 };
              const percent = percentages[star as keyof typeof percentages];
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-3">{star}</span>
                  <Star className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-10 text-right">{percent}%</span>
                </div>
              );
            })}
          </div>

          {/* Individual Reviews Mockup */}
          <div className="lg:col-span-2 space-y-8">
            {[
              { name: 'Ahmed Khan', date: '2 weeks ago', rating: 5, comment: 'MashAllah, the quality of this book is exceptional. The printing is clear and the binding is very durable. Highly recommend for every Muslim household.', avatar: 'A' },
              { name: 'Sara Malik', date: '1 month ago', rating: 5, comment: 'Very fast delivery across Lahore. The packaging was beautiful and ensured the product arrived safely. JazakAllah!', avatar: 'S' },
              { name: 'Zaid Ali', date: '2 months ago', rating: 4, comment: 'Great product, though I wish there were more color options available. Still, the content is what matters most.', avatar: 'Z' }
            ].map((review, i) => (
              <div key={i} className="flex gap-4 pb-8 border-b border-border/50 last:border-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {review.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-foreground">{review.name}</h4>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-accent text-accent' : 'text-border'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">View All Reviews</Button>
          </div>
        </div>
      </section>

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
    </main>
  );
};

export default ProductDetail;
