import { useEffect, useState } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, reviewer_name, rating, comment, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setReviews(data);
    setLoading(false);
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
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      reviewer_name: name.trim(),
      rating,
      comment: comment.trim(),
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Review submitted!', description: 'Your review will appear after admin approval.' });
      setShowForm(false);
      setComment('');
      setRating(5);
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : productRating;

  const totalReviews = reviews.length || productReviews;

  // Star distribution
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
                    <h4 className="font-semibold text-foreground">{review.reviewer_name}</h4>
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
