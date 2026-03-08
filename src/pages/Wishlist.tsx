import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const Wishlist = () => {
  const { wishlist } = useWishlist();

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="section-heading">Your Collection</p>
        <h1 className="section-title">Wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg">
          Items you've saved for later. Ready to bring them home?
        </p>
      </div>

      {wishlist.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
            <Heart className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Your wishlist is empty</h2>
          <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
            Explore our collection and save your favorite items here to keep track of them.
          </p>
          <Button asChild className="mt-8 gap-2">
            <Link to="/shop">Explore Shop <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}

      {wishlist.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/shop"><ShoppingBag className="h-4 w-4" /> Continue Shopping</Link>
          </Button>
        </div>
      )}
    </main>
  );
};

export default Wishlist;
