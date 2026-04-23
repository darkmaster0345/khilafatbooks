import { useState, useEffect } from 'react';
import { Mail, Send, Users, Download, Search, ToggleLeft, ToggleRight, Eye, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
const db = supabase;
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import type { Tables } from '@/integrations/supabase/types';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  is_active: boolean;
}

interface Campaign {
  id: string;
  subject: string;
  sent_at: string;
  recipient_count: number;
}

type NewsletterSubscriberRow = Tables<'newsletter_subscribers'>;
type NewsletterCampaignRow = Tables<'newsletter_campaigns'>;

const AdminNewsletter = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSubscribers();
    fetchCampaigns();
  }, []);

  const fetchSubscribers = async () => {
    setLoadingSubs(true);
    const { data, error } = await db
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    if (!error && data) setSubscribers(data as NewsletterSubscriberRow[]);
    setLoadingSubs(false);
  };

  const fetchCampaigns = async () => {
    const { data } = await db
      .from('newsletter_campaigns')
      .select('id, subject, sent_at, recipient_count')
      .order('sent_at', { ascending: false })
      .limit(10);
    if (data) setCampaigns(data as NewsletterCampaignRow[]);
  };

  const toggleSubscriber = async (id: string, currentActive: boolean) => {
    await db
      .from('newsletter_subscribers')
      .update({ is_active: !currentActive })
      .eq('id', id);
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentActive } : s));
  };

  const handleSend = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast({ title: 'Missing fields', description: 'Subject and body are required.', variant: 'destructive' });
      return;
    }

    setSending(true);
    setLastResult(null);
    try {
      const { data: { session } } = await db.auth.getSession();
      const res = await db.functions.invoke('send-newsletter', {
        body: { subject, body_html: bodyHtml },
      });

      if (res.error) throw new Error(res.error.message);

      const result = res.data;
      setLastResult({ sent: result.sent, failed: result.failed });
      toast({ title: 'Newsletter sent!', description: `Sent to ${result.sent} subscribers.` });
      fetchCampaigns();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Send failed', description: message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const exportCsv = () => {
    const active = subscribers.filter(s => s.is_active);
    const csv = ['Email,Name,Subscribed Date', ...active.map(s =>
      `${s.email},${s.name || ''},${format(new Date(s.subscribed_at), 'yyyy-MM-dd')}`
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = subscribers.filter(s => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Newsletter</h2>
          <p className="text-sm text-muted-foreground mt-1">Compose and send newsletters to your subscribers</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="h-3.5 w-3.5 mr-1.5" />
          {activeCount} active subscriber{activeCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose" className="gap-1.5"><Send className="h-3.5 w-3.5" /> Compose</TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Subscribers</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> History</TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compose Newsletter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line</label>
                <Input
                  placeholder="e.g. New Arrivals This Week 📚"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email Body (HTML)</label>
                <Textarea
                  placeholder="<h1>Assalamu Alaikum!</h1><p>Check out our latest books...</p>"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!bodyHtml.trim()}>
                  <Eye className="h-4 w-4 mr-1.5" /> Preview
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={sending || !subject.trim() || !bodyHtml.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                      Send to {activeCount} Subscriber{activeCount !== 1 ? 's' : ''}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send Newsletter?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send an email with subject "<strong>{subject}</strong>" to <strong>{activeCount}</strong> active subscriber{activeCount !== 1 ? 's' : ''}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSend}>Send Now</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {lastResult && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    Sent to <strong>{lastResult.sent}</strong> subscriber{lastResult.sent !== 1 ? 's' : ''}.
                    {lastResult.failed > 0 && <span className="text-destructive ml-1">{lastResult.failed} failed.</span>}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSubs ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No subscribers found</TableCell></TableRow>
                ) : (
                  filtered.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell className="text-muted-foreground">{sub.name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(sub.subscribed_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={sub.is_active ? 'default' : 'secondary'} className="text-xs">
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleSubscriber(sub.id, sub.is_active)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {sub.is_active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No campaigns sent yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Recipients</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.subject}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{format(new Date(c.sent_at), 'MMM d, yyyy h:mm a')}</TableCell>
                        <TableCell><Badge variant="secondary">{c.recipient_count}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-sm text-muted-foreground mb-2">Subject: <strong className="text-foreground">{subject}</strong></div>
            <hr className="mb-4" />
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNewsletter;
