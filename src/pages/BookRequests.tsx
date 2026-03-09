import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Plus, Check, Sparkles, TrendingUp, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPKR } from '@/lib/currency';
import { toast } from 'sonner';

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  image_url: string | null;
  status: string;
  pledge_goal: number;
  pledge_fee: number;
  pledge_count: number;
  has_pledged: boolean;
  estimated_price: number | null;
  created_at: string;
}

const PLEDGE_FEE = 500;

const BookRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pledging, setPledging] = useState<string | null>(null);

  const fetchRequests = async () => {
    const { data: reqs } = await supabase
      .from('book_requests')
      .select('*')
      .in('status', ['voting', 'funded', 'fulfilled'])
      .order('created_at', { ascending: false });

    if (!reqs) { setLoading(false); return; }

    const requestIds = reqs.map((r: any) => r.id);

    // Get pledge counts via secure RPC, and user's own pledges if logged in
    const pledgeCounts = await Promise.all(
      requestIds.map(async (id: string) => {
        const { data: count } = await supabase.rpc('get_pledge_count', { p_request_id: id });
        return { request_id: id, count: count || 0 };
      })
    );

    let userPledges: string[] = [];
    if (user) {
      const { data: myPledges } = await supabase
        .from('book_pledges')
        .select('request_id')
        .eq('user_id', user.id)
        .in('request_id', requestIds);
      userPledges = (myPledges || []).map((p: any) => p.request_id);
    }

    const enriched: BookRequest[] = reqs.map((r: any) => {
      const countEntry = pledgeCounts.find(pc => pc.request_id === r.id);
      return {
        ...r,
        pledge_count: countEntry?.count || 0,
        has_pledged: userPledges.includes(r.id),
      };
    });

    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('book-pledges-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_pledges' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSuggest = async () => {
    if (!user) { toast.error('Please sign in to suggest a book'); return; }
    if (!title.trim()) { toast.error('Book title is required'); return; }
    if (title.length > 200) { toast.error('Title too long'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('book_requests').insert({
      title: title.trim(),
      author: author.trim() || null,
      description: description.trim() || null,
      suggested_by: user.id,
      pledge_goal: 20,
      pledge_fee: PLEDGE_FEE,
    } as any);

    if (error) {
      toast.error('Failed to submit suggestion');
    } else {
      toast.success('Book suggested! Others can now pledge on it.');
      setTitle(''); setAuthor(''); setDescription('');
      setSuggestOpen(false);
      fetchRequests();
    }
    setSubmitting(false);
  };

  const handlePledge = async (requestId: string) => {
    if (!user) { toast.error('Please sign in to pledge'); return; }

    setPledging(requestId);
    const { error } = await supabase.from('book_pledges').insert({
      request_id: requestId,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email,
    } as any);

    if (error) {
      if (error.code === '23505') {
        toast.error('You already pledged for this book!');
      } else {
        toast.error('Failed to pledge');
      }
    } else {
      toast.success('Security deposit registered! 🎉', {
        description: `Rs. ${PLEDGE_FEE} deposit recorded. This will be credited towards your purchase when the book arrives.`,
      });
      fetchRequests();
    }
    setPledging(null);
  };

  const handleUnpledge = async (requestId: string) => {
    if (!user) return;
    await supabase.from('book_pledges').delete().eq('request_id', requestId).eq('user_id', user.id);
    toast.success('Pledge withdrawn — your deposit is refunded');
    fetchRequests();
  };

  const votingRequests = requests.filter(r => r.status === 'voting');
  const fundedRequests = requests.filter(r => r.status === 'funded');
  const fulfilledRequests = requests.filter(r => r.status === 'fulfilled');

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      <Helmet>
        <title>Request a Book | Khilafat Books</title>
        <meta name="description" content="Vote on which Islamic books you want us to import next. Pledge Rs. 500 as a security deposit and we'll bring it to Pakistan when 20 people agree." />
        <link rel="canonical" href="https://khilafatbooks.lovable.app/book-requests" />
        <meta property="og:title" content="Request a Book | Khilafat Books" />
        <meta property="og:description" content="Vote on which Islamic books you want us to import next. Community-driven book importing for Pakistan." />
        <meta property="og:url" content="https://khilafatbooks.lovable.app/book-requests" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="section-heading flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Community-Driven
            </p>
            <h1 className="section-title">Request a Book</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
              Can't find a book you want? Suggest it! When 20 people pledge{' '}
              <strong className="text-foreground">{formatPKR(PLEDGE_FEE)}</strong> each as a security deposit, we'll import it.
              Your deposit is fully credited towards your purchase.
            </p>
          </div>

          <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 rounded-xl">
                <Plus className="h-4 w-4" /> Suggest a Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Suggest a Book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Book Title *</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Riyad as-Salihin" className="mt-1.5 h-11 rounded-xl" maxLength={200} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Author</label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Imam An-Nawawi" className="mt-1.5 h-11 rounded-xl" maxLength={100} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Why do you want this book?</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell others why this book is worth importing..." className="mt-1.5 rounded-xl" maxLength={500} rows={3} />
                </div>
                <Button onClick={handleSuggest} disabled={submitting} className="w-full h-11 rounded-xl">
                  {submitting ? 'Submitting...' : 'Submit Suggestion'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* How it works — Shariah Compliant */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { step: '1', title: 'Suggest or Vote', desc: 'Suggest a book or show interest by pledging' },
          { step: '2', title: 'Security Deposit', desc: `${formatPKR(PLEDGE_FEE)} deposit (Hamish Jiddiyyah) — fully refundable` },
          { step: '3', title: 'We Import & You Buy', desc: "The actual sale happens only when the book is in our possession" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm mx-auto mb-2">
              {s.step}
            </div>
            <p className="text-sm font-semibold text-foreground">{s.title}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Shariah Compliance Notice */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-10 flex gap-3 items-start">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground text-sm mb-1">100% Shariah Compliant</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Your <strong className="text-foreground">{formatPKR(PLEDGE_FEE)}</strong> is a <strong className="text-foreground">security deposit</strong> (Hamish Jiddiyyah), not a sale — the actual sale happens only when the book is in our possession.</li>
            <li>Your deposit is <strong className="text-foreground">fully credited</strong> towards the final purchase price.</li>
            <li>If the final price changes significantly from the estimate, you have <strong className="text-foreground">full right to withdraw</strong> and get your deposit back.</li>
            <li>If import fails, you choose: <strong className="text-foreground">full EasyPaisa refund</strong> or <strong className="text-foreground">store credit</strong> — your choice, no coercion.</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
              <div className="h-5 w-1/3 bg-muted rounded mb-3" />
              <div className="h-3 w-1/2 bg-muted rounded mb-4" />
              <div className="h-2 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {votingRequests.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" /> Active Requests
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence>
                  {votingRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onPledge={handlePledge}
                      onUnpledge={handleUnpledge}
                      pledging={pledging}
                      isLoggedIn={!!user}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {fundedRequests.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Goal Reached — Importing!
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {fundedRequests.map((req) => (
                  <RequestCard key={req.id} request={req} onPledge={handlePledge} onUnpledge={handleUnpledge} pledging={pledging} isLoggedIn={!!user} />
                ))}
              </div>
            </section>
          )}

          {fulfilledRequests.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Now Available
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {fulfilledRequests.map((req) => (
                  <RequestCard key={req.id} request={req} onPledge={handlePledge} onUnpledge={handleUnpledge} pledging={pledging} isLoggedIn={!!user} />
                ))}
              </div>
            </section>
          )}

          {requests.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-border bg-card">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-foreground">No book requests yet</h2>
              <p className="mt-2 text-muted-foreground">Be the first to suggest a book!</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

const RequestCard = ({
  request: req, onPledge, onUnpledge, pledging, isLoggedIn,
}: {
  request: BookRequest;
  onPledge: (id: string) => void;
  onUnpledge: (id: string) => void;
  pledging: string | null;
  isLoggedIn: boolean;
}) => {
  const progress = Math.min(100, (req.pledge_count / req.pledge_goal) * 100);
  const isFunded = req.status === 'funded' || req.pledge_count >= req.pledge_goal;
  const isFulfilled = req.status === 'fulfilled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-5 transition-all ${
        isFulfilled ? 'border-primary/20 bg-primary/5' :
        isFunded ? 'border-accent/20 bg-accent/5' :
        'border-border bg-card hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base font-bold text-foreground truncate">{req.title}</h3>
            {isFulfilled && <Badge className="bg-primary/15 text-primary text-[10px]">📚 Available</Badge>}
            {isFunded && !isFulfilled && <Badge className="bg-accent/15 text-accent-foreground text-[10px]">🎉 Goal Reached</Badge>}
          </div>
          {req.author && <p className="text-xs text-muted-foreground mt-0.5">by {req.author}</p>}
          {req.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{req.description}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Estimated Price */}
      {req.estimated_price && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Estimated final price: <strong className="text-foreground">{formatPKR(req.estimated_price)}</strong></span>
          <span className="text-[10px]">(may vary — you can withdraw if it changes significantly)</span>
        </div>
      )}

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {req.pledge_count}/{req.pledge_goal} pledges
          </span>
          <span className="font-medium text-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {formatPKR(req.pledge_fee)} security deposit
        </span>

        {isFulfilled ? (
          <Button asChild size="sm" className="rounded-lg h-8 text-xs gap-1">
            <Link to="/shop">Shop Now <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        ) : req.has_pledged ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUnpledge(req.id)}
            className="rounded-lg h-8 text-xs gap-1"
          >
            <Check className="h-3 w-3" /> Pledged ✓
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => isLoggedIn ? onPledge(req.id) : toast.error('Please sign in to pledge')}
            disabled={pledging === req.id}
            className="rounded-lg h-8 text-xs gap-1"
          >
            {pledging === req.id ? 'Pledging...' : `Deposit ${formatPKR(req.pledge_fee)}`}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default BookRequests;