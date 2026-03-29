import { useState, useEffect } from 'react';
import { BookOpen, Users, Send, Check, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatPKR } from '@/lib/currency';
import { toast } from 'sonner';

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  status: string;
  pledge_goal: number;
  pledge_fee: number;
  pledge_count: number;
  estimated_price: number | null;
  created_at: string;
}

const AdminBookRequests = () => {
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);







  const [notifying, setNotifying] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data: reqs } = await supabase
        .from('book_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!reqs) {
        setRequests([]);
        return;
      }

      const requestIds = reqs.map((r: any) => r.id);
      if (requestIds.length === 0) {
        setRequests([]);
        return;
      }

      const { data: pledges } = await supabase
        .from('book_pledges')
        .select('request_id')
        .in('request_id', requestIds);

      const enriched: BookRequest[] = reqs.map((r: any) => ({
        ...r,
        pledge_count: (pledges || []).filter((p: any) => p.request_id === r.id).length,
      }));

      setRequests(enriched);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('book_requests').update({ status } as any).eq('id', id);
    toast.success(`Status updated to ${status}`);
    fetchRequests();
  };

  const saveEstimatedPrice = async (id: string) => {
    const price = parseInt(priceValue);
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid price'); return; }
    await supabase.from('book_requests').update({ estimated_price: price } as any).eq('id', id);
    toast.success('Estimated price updated — visible to pledgers');
    setEditingPrice(null);
    setPriceValue('');
    fetchRequests();
  };

  const notifyPledgers = async (requestId: string) => {
    setNotifying(requestId);
    try {
      const { data, error } = await supabase.functions.invoke('notify-pledgers', {
        body: { requestId },
      });
      if (error) throw error;
      toast.success(`Notified ${data?.sent || 0} pledgers!`);
      fetchRequests();
    } catch (e: any) {
      toast.error(`Failed to notify: ${e.message}`);
    }
    setNotifying(null);
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this book request and all its pledges?')) return;
    await supabase.from('book_requests').delete().eq('id', id);
    toast.success('Request deleted');
    fetchRequests();
  };

  const statusColors: Record<string, string> = {
    voting: 'bg-accent/10 text-accent-foreground',
    funded: 'bg-primary/10 text-primary',
    fulfilled: 'bg-primary/15 text-primary',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Book Requests</h2>
          <p className="text-sm text-muted-foreground">Manage community book requests and pledges (Shariah-compliant)</p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <BookOpen className="h-3 w-3" /> {requests.length} requests
        </Badge>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-border bg-card">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No book requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const progress = Math.min(100, (req.pledge_count / req.pledge_goal) * 100);
            return (
              <div key={req.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-sm font-bold text-foreground">{req.title}</h3>
                      <Badge className={`text-[10px] ${statusColors[req.status] || ''}`}>
                        {req.status}
                      </Badge>
                    </div>
                    {req.author && <p className="text-xs text-muted-foreground mt-0.5">by {req.author}</p>}

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <Users className="h-3 w-3" />
                      <span>{req.pledge_count}/{req.pledge_goal} pledges</span>
                      <span>•</span>
                      <span>Deposits: {formatPKR(req.pledge_count * req.pledge_fee)}</span>
                      {req.estimated_price && (
                        <>
                          <span>•</span>
                          <span>Est. price: {formatPKR(req.estimated_price)}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 max-w-xs">
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    {/* Set estimated price */}
                    {req.status === 'voting' && (
                      <div className="mt-3">
                        {editingPrice === req.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Estimated final price (Rs.)"
                              value={priceValue}
                              onChange={e => setPriceValue(e.target.value)}
                              className="h-8 text-xs w-40 rounded-lg"
                            />
                            <Button size="sm" variant="outline" onClick={() => saveEstimatedPrice(req.id)} className="h-8 text-xs">
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingPrice(null)} className="h-8 text-xs">
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingPrice(req.id); setPriceValue(req.estimated_price?.toString() || ''); }}
                            className="h-7 text-[11px] gap-1 text-muted-foreground"
                          >
                            <DollarSign className="h-3 w-3" />
                            {req.estimated_price ? 'Update estimated price' : 'Set estimated price (for transparency)'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {req.status === 'voting' && req.pledge_count >= req.pledge_goal && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'funded')} className="h-8 text-xs gap-1">
                        <Check className="h-3 w-3" /> Mark Funded
                      </Button>
                    )}
                    {(req.status === 'funded') && (
                      <Button
                        size="sm"
                        onClick={() => notifyPledgers(req.id)}
                        disabled={notifying === req.id}
                        className="h-8 text-xs gap-1"
                      >
                        <Send className="h-3 w-3" />
                        {notifying === req.id ? 'Sending...' : 'Notify & Fulfill'}
                      </Button>
                    )}
                    {req.status === 'voting' && (
                      <Button size="sm" variant="ghost" onClick={() => deleteRequest(req.id)} className="h-8 text-xs text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBookRequests;