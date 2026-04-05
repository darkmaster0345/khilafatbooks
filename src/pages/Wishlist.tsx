import { SEOHead } from '@/components/SEOHead';
import { useWishlist } from '@/context/WishlistContext';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import ProductCard from '@/components/ProductCard';

const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <>
      <SEOHead title="Your Wishlist | Khilafat Books" description="Saved Islamic books and products you want to buy later." canonical="/wishlist" noIndex={true} />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground flex items-center gap-3">
            My Wishlist <Heart className="h-8 w-8 text-primary fill-primary/20" />
          </h1>
          <p className="text-muted-foreground mt-2">Saved items you're interested in.</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="py-20 text-center bg-card border border-border rounded-3xl shadow-sm">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground">Your wishlist is empty</h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Found something you like? Click the heart icon to save it here for later.
            </p>
            <Button asChild className="mt-8 rounded-xl px-8" size="lg">
              <Link to="/shop">Explore Collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {wishlist.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <ProductCard product={product} />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-4 right-14 h-9 w-9 flex items-center justify-center rounded-full bg-background/90 text-destructive border border-border shadow-sm hover:bg-destructive hover:text-white transition-all z-10"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </>
  );
};

export default Wishlist;
