import { SEOHead } from '@/components/SEOHead';
import { useState, useEffect } from 'react';
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

    const requestIds = reqs.map(r => r.id);
    const pledgeCounts = await Promise.all(
      requestIds.map(async id => {
        const { data } = await supabase.rpc('get_pledge_count', { p_request_id: id });
        return { request_id: id, count: Number(data) || 0 };
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

  const onPledge = async (requestId: string) => {
    if (!user) { toast.error('Please sign in to pledge'); return; }
    setPledging(requestId);
    const { error } = await supabase.from('book_pledges').insert({
      request_id: requestId,
      user_id: user.id,
    });
    if (error) toast.error('Already pledged or error occurred');
    else toast.success('Pledge successful! JazakAllah.');
    setPledging(null);
    fetchRequests();
  };

  const onUnpledge = async (requestId: string) => {
    const { error } = await supabase.from('book_pledges').delete().eq('request_id', requestId).eq('user_id', user?.id);
    if (!error) toast.success('Pledge removed');
    fetchRequests();
  };

  return (
    <>
      <SEOHead
        title="Request a Book | Khilafat Books"
        description="Can't find a specific Islamic title? Request it here and we'll source it for you. Pledge your interest and we'll add it to the Khilafat Books catalog."
        canonical="/book-requests"
      />
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">Request a Book</h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Can't find a specific Islamic title? Suggest it to our community. If enough people pledge their interest, we'll source and add it to our catalog.
            </p>
          </div>

          <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-5 w-5" /> Suggest New Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold">Suggest a Title</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Book Title *</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Al-Fawz al-Kabir" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Author Name</label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Shah Waliullah Dehlawi" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Why should we add this?</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe the book..." className="rounded-xl min-h-[100px]" />
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By suggesting, you agree to follow up with a pledge if others show interest. We prioritize authentic, scholar-approved literature.
                  </p>
                </div>
                <Button onClick={handleSuggest} disabled={submitting} className="w-full h-11 rounded-xl">
                  {submitting ? 'Submitting...' : 'Submit Suggestion'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)
          ) : requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onPledge={onPledge}
              onUnpledge={onUnpledge}
              pledging={pledging}
              isLoggedIn={!!user}
            />
          ))}
        </div>
      </main>
    </>
  );
};

const RequestCard = ({ request: req, onPledge, onUnpledge, pledging, isLoggedIn }: any) => {
  const progress = (req.pledge_count / req.pledge_goal) * 100;
  const isFulfilled = req.status === 'fulfilled';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <Badge variant={isFulfilled ? 'default' : 'secondary'} className="capitalize">{req.status}</Badge>
        {isFulfilled && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
      </div>

      <h3 className="font-display text-xl font-bold text-foreground line-clamp-1">{req.title}</h3>
      <p className="text-sm text-muted-foreground font-medium mb-3">{req.author || 'Unknown Author'}</p>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-6 min-h-[32px]">
        {req.description || 'No description provided.'}
      </p>

      <div className="space-y-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {req.pledge_count} / {req.pledge_goal} Pledges
          </span>
          <span className="font-bold text-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
          Pledge: {formatPKR(req.pledge_fee)}
        </div>

        {isFulfilled ? (
          <Button asChild size="sm" className="rounded-lg h-9 gap-2">
            <Link to="/shop">Buy Now <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        ) : requestHasPledged(req) ? (
          <Button variant="outline" size="sm" className="rounded-lg h-9 gap-2 border-primary text-primary" onClick={() => onUnpledge(req.id)}>
            <Check className="h-4 w-4" /> Pledged
          </Button>
        ) : (
          <Button size="sm" className="rounded-lg h-9 gap-2" onClick={() => onPledge(req.id)} disabled={pledging === req.id}>
            {pledging === req.id ? '...' : 'Pledge Now'}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Helper for brevity
const requestHasPledged = (req: any) => req.has_pledged;

export default BookRequests;
