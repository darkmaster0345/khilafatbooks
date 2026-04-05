import { Star, BellRing, BadgeCheck, Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LegacyProduct } from '@/hooks/useProducts';
import { formatPKR } from '@/lib/currency';
import OptimizedImage from './OptimizedImage';
import { resolveProductImage, getProductSrcSet, getProductPlaceholder } from '@/lib/productImages';
import { useState } from 'react';
import LeadCaptureModal from './LeadCaptureModal';

interface Props {
  product: LegacyProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductQuickView = ({ product, open, onOpenChange }: Props) => {
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  if (!product) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[2/3] bg-muted">
              <OptimizedImage
                src={resolveProductImage(product.image, 600)}
                srcSet={getProductSrcSet(product.image)}
                placeholder={getProductPlaceholder(product.image)}
                alt={product.name}
                className="h-full w-full"
              />
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {product.isNew && <Badge className="bg-accent text-accent-foreground shadow-sm">New</Badge>}
                {product.type === 'digital' && (
                  <Badge variant="secondary" className="shadow-sm"><Download className="mr-1 h-3 w-3" /> Digital</Badge>
                )}
              </div>
            </div>
            <div className="p-6 flex flex-col h-full">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">{product.category}</p>
              <h2 className="mt-1.5 font-display text-xl font-bold text-foreground leading-snug">{product.name}</h2>
              {product.nameAr && <p className="font-amiri text-sm text-muted-foreground mt-1" dir="rtl">{product.nameAr}</p>}

              <div className="mt-3 flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-border'}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-foreground">{formatPKR(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
                )}
              </div>

              <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{product.description}</p>

              {product.isHalal && (
                <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium">
                  <BadgeCheck className="h-4 w-4" /> Halal Certified
                </div>
              )}

              <div className="mt-auto pt-5 flex flex-col gap-2.5">
                <Button
                  onClick={() => { setLeadModalOpen(true); onOpenChange(false); }}
                  className="w-full gap-2 h-11 rounded-xl gold-gradient border-0 text-foreground font-bold shadow-lg"
                >
                  <BellRing className="h-4 w-4" /> Notify Me When Available
                </Button>
                <Button variant="outline" asChild className="w-full rounded-xl gap-2">
                  <Link to={`/books/${product.slug}`} onClick={() => onOpenChange(false)}>
                    <Eye className="h-4 w-4" /> View Full Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LeadCaptureModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        product={{ id: product.id, name: product.name }}
      />
    </>
  );
};

export default ProductQuickView;
