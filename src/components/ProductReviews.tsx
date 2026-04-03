import { useEffect, useState, useRef } from 'react';
import { Star, MessageSquare, Loader2, BadgeCheck, Upload, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  verified_purchase: boolean;
  images?: string[];
}

interface Props {
  productId: string;
  productRating: number;
  productReviews: number;
}

const ProductReviews = ({ productId, productRating, productReviews }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, reviewer_name, rating, comment, created_at, verified_purchase')
      .eq('product_id', productId as any)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      // Fetch images for each review
      const reviewIds = data.map((r: any) => r.id);
      const { data: images } = await supabase
        .from('review_images')
        .select('review_id, image_url')
        .in('review_id', reviewIds);

      const reviewsWithImages = data.map((r: any) => ({
        ...r,
        images: images?.filter((img: any) => img.review_id === r.id).map((img: any) => img.image_url) || [],
      }));

      setReviews(reviewsWithImages);
    }
    setLoading(false);
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 3) {
      toast({ title: 'Max 3 images', description: 'You can upload up to 3 images per review.', variant: 'destructive' });
      return;
    }
    const newFiles = [...imageFiles, ...files].slice(0, 3);
    setImageFiles(newFiles);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const submitReview = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to leave a review.', variant: 'destructive' });
      return;
    }
    if (!name.trim() || !comment.trim()) {
      toast({ title: 'Required fields', description: 'Please fill in your name and comment.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    const { data: reviewData, error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      reviewer_name: name.trim(),
      rating,
      comment: comment.trim(),
    } as any).select('id').single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const rd = reviewData as any;

    // Upload images if any
    if (rd && imageFiles.length > 0) {
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop();
        const path = `${rd.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('review-images').upload(path, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('review-images').getPublicUrl(path);
          await supabase.from('review_images').insert({
            review_id: rd.id,
            image_url: urlData.publicUrl,
          } as any);
        }
      }
    }

    toast({ title: 'Review submitted!', description: 'Your review will appear after admin approval.' });
    setShowForm(false);
    setComment('');
    setRating(5);
    setImageFiles([]);
    setImagePreviews([]);
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : productRating;

  const totalReviews = reviews.length || productReviews;

  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return { star, count, percent: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0 };
  });

  return (
    <section className="mt-20 border-t border-border pt-16">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Customer Reviews</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.floor(avgRating) ? 'fill-accent text-accent' : 'text-border'}`} />
              ))}
            </div>
            <span className="text-lg font-bold text-foreground">{avgRating.toFixed(1)} out of 5</span>
            <span className="text-sm text-muted-foreground">Based on {totalReviews} reviews</span>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <MessageSquare className="h-4 w-4" /> {showForm ? 'Cancel' : 'Write a Review'}
        </Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-10 rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Write Your Review</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Your Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="mt-1.5 h-11 rounded-xl" maxLength={50} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(i)}
                    className="p-0.5"
                  >
                    <Star className={`h-7 w-7 transition-colors ${
                      i <= (hoverRating || rating) ? 'fill-accent text-accent' : 'text-border'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Your Review</label>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." className="mt-1.5 rounded-xl" rows={4} maxLength={500} />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Add Photos (optional, max 3)</label>
              <div className="flex items-center gap-3 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors"
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageAdd} className="hidden" multiple />
              </div>
            </div>

            <Button onClick={submitReview} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit Review
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Distribution */}
        <div className="lg:col-span-1 space-y-4">
          {distribution.map(({ star, percent }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-3">{star}</span>
              <Star className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-sm text-muted-foreground w-10 text-right">{percent}%</span>
            </div>
          ))}
        </div>

        {/* Individual Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="flex gap-4 pb-8 border-b border-border/50 last:border-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {review.reviewer_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{review.reviewer_name}</h4>
                      {review.verified_purchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <BadgeCheck className="h-3 w-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-accent text-accent' : 'text-border'}`} />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}
                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxImage(img)}
                          className="h-16 w-16 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                        >
                          <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm p-4"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={lightboxImage}
              alt="Review photo"
              className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProductReviews;
