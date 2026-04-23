import { Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Phone, Mail, Star, TrendingUp, ShoppingBag, Calendar, Clock, CheckCircle2, XCircle, Truck, Download, Eye, Heart, BadgeCheck, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useProductById, normalizeProduct, isProductAvailable, isProductLowStock, calculateDiscountPercentage } from '@/lib/product-data';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageGalleryProps {
  imageUrl: string | null;
  productName: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ imageUrl, productName }) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setCurrentImage(imageUrl);
      setLoaded(true);
    }
  }, [imageUrl]);

  if (!currentImage) {
    return (
      <div className="relative aspect-square bg-muted flex items-center justify-center rounded-2xl overflow-hidden border-2 border-dashed border-border">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden border border-border shadow-sm">
      {loaded ? (
        <img
          src={currentImage}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={() => setCurrentImage(null)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      )}
    </div>
  );
};

const ProductBadges: React.FC<{ product: any }> = ({ product }) => {
  const badges = [];

  if (product.is_new) {
    badges.push(
      <Badge key="new" className="bg-accent text-accent-foreground text-[10px] font-semibold shadow-md">New</Badge>
    );
  }

  if (product.is_halal) {
    badges.push(
      <Badge
        key="halal"
        variant="outline"
        className="bg-background/90 text-[10px] backdrop-blur-md shadow-md"
      >
        <BadgeCheck className="mr-1 h-3 w-3 text-primary" /> Halal
      </Badge>
    );
  }

  if (product.is_used) {
    badges.push(
      <Badge key="used" className="bg-muted text-muted-foreground text-[10px] shadow-md">
        Used - {product.condition_description || 'Standard'}
      </Badge>
    );
  }

  if (product.in_stock && product.stock_quantity <= (product.low_stock_threshold || 5)) {
    badges.push(
      <Badge key="low-stock" variant="destructive" className="text-[10px] shadow-md">
        Low Stock ({product.stock_quantity})
      </Badge>
    );
  }

  return <>{badges}</>;
};

const ProductPricing: React.FC<{ product: any }> = ({ product }) => {
  const discountPercent = calculateDiscountPercentage(product);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="font-display text-2xl font-bold text-foreground">
          {product.price === 0 ? 'Free' : formatPKR(product.price)}
        </span>
        {discountPercent && (
          <>
            <span className="text-lg font-bold text-destructive line-through">
              {formatPKR(product.original_price!)}
            </span>
            <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
              {discountPercent}% OFF
            </span>
          </>
        )}
      </div>
      {product.bundle_discount && (
        <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 px-3 py-2 rounded-lg">
          <Gift className="h-4 w-4" />
          <span>Bundle Discount: {formatPKR(product.bundle_discount)}</span>
        </div>
      )}
    </div>
  );
};

const ProductDetails: React.FC<{ product: any }> = ({ product }) => {
  const { toast } = useToast();

  const handleNotifyMe = () => {
    toast({
      title: 'Notify Me',
      description: `We'll notify you when ${product.name} becomes available.`,
    });
  };

  const handleDownloadDigital = () => {
    if (!product.digital_file_url) {
      toast({ title: 'No file available', variant: 'destructive' });
      return;
    }
    window.open(product.digital_file_url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Product Information Section */}
      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {product.name}
            </h1>
            {product.name_ar && (
              <p className="text-lg text-muted-foreground/80 font-amiri rtl:pr-4" dir="rtl">
                {product.name_ar}
              </p>
            )}
            <ProductBadges product={product} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="space-y-4">
              <ImageGallery imageUrl={product.image_url} productName={product.name} />
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-foreground">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>

              {/* Key Attributes */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Price</span>
                  <p className="text-lg font-semibold text-foreground">
                    {formatPKR(product.price)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Category</span>
                  <p className="text-lg font-semibold text-foreground">{product.category}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Type</span>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {product.type}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                  <Badge
                    className={`text-xs ${product.in_stock
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                  >
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>

              {/* Hidden Attributes (for debugging/admin) */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Product Attributes
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="font-medium">{product.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Reviews:</span>
                    <span className="font-medium">{product.reviews}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">{product.stock_quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Threshold:</span>
                    <span className="font-medium">{product.low_stock_threshold}</span>
                  </div>
                  {product.ethical_source && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">Ethical Source:</span>
                      <span className="font-medium">{product.ethical_source}</span>
                    </div>
                  )}
                  {product.digital_file_url && (
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">Digital File:</span>
                      <span className="font-medium">Available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 h-12 rounded-xl font-bold" size="lg">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl flex-1 gap-2"
              onClick={handleNotifyMe}
            >
              <BellRing className="h-5 w-5" />
              Notify Me
            </Button>
          </div>

          {/* Digital Product Download */}
          {product.type === 'digital' && (
            <div className="mt-6 pt-6 border-t border-border">
              <Button
                variant="secondary"
                className="w-full h-12 rounded-xl gap-2"
                onClick={handleDownloadDigital}
              >
                <Download className="h-5 w-5" />
                Download Digital Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { product, loading, error } = useProductById(id);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="font-display text-2xl font-bold mb-4 text-destructive">
            Product Not Found
          </h2>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Enforce visibility logic - hide products marked as hidden
  if (product.is_hidden) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Product Unavailable</h2>
          <p className="text-muted-foreground">This product is currently not available.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={product.name}
        description={product.description.substring(0, 160)}
        canonical={`/products/${id}`}
      />
      <main className="container mx-auto px-4 py-10 max-w-7xl">
        <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Shop
        </Link>
        <ProductDetails product={product} />
      </main>
    </>
  );
};

export default ProductDetailPage;
