import { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  Download,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Book,
  User,
  Filter,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const db = supabase as any;

const AdminWaitlist = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await db
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      toast({
        title: 'Fetch failed',
        description: err.message || 'Check permissions or connection.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this lead? This action cannot be undone.')) return;
    try {
      setDeleting(id);
      const { error } = await db.from('waitlist').delete().eq('id', id);
      if (error) throw error;
      setLeads(leads.filter(l => l.id !== id));
      toast({ title: 'Lead removed' });
    } catch (err: any) {
      toast({
        title: 'Delete failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Date', 'Book Name', 'User Name', 'Email', 'Phone'];
    const rows = leads.map(l => [
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
      l.book_name,
      l.user_name,
      l.user_email,
      l.user_phone || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `khilafat-waitlist-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'CSV Exported', description: `${leads.length} leads saved to file.` });
  };

  const filtered = leads.filter(l =>
    l.user_name.toLowerCase().includes(search.toLowerCase()) ||
    l.user_email.toLowerCase().includes(search.toLowerCase()) ||
    l.book_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Waitlist & Leads</h2>
          <p className="text-sm text-muted-foreground">Manage user interest for coming-soon products.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLeads} className="gap-2 rounded-xl">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={exportToCSV} disabled={leads.length === 0} className="gap-2 rounded-xl shadow-md gold-gradient border-0 text-foreground font-bold">
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email or book..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card border-border/60 focus:ring-primary/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
          <p className="text-muted-foreground text-sm font-medium">Fetching waitlist data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/5">
          <User className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No leads found</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {search ? 'Adjust your search filters to find what you are looking for.' : 'Waitlist entries will appear here once users join through the storefront.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-6 py-4 font-bold text-foreground">Date</th>
                  <th className="px-6 py-4 font-bold text-foreground">Book Name</th>
                  <th className="px-6 py-4 font-bold text-foreground">Customer</th>
                  <th className="px-6 py-4 font-bold text-foreground">Contact</th>
                  <th className="px-6 py-4 font-bold text-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                      </div>
                      <span className="text-[10px] ml-5.5 text-muted-foreground/60">{format(new Date(lead.created_at), 'HH:mm')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <Book className="h-4 w-4 text-primary shrink-0" />
                        <span className="line-clamp-1">{lead.book_name}</span>
                      </div>
                      <span className="text-[10px] ml-6 text-muted-foreground">ID: {lead.book_id?.slice(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{lead.user_name}</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                        <Mail className="h-3.5 w-3.5" />
                        <a href={`mailto:${lead.user_email}`} className="hover:underline">{lead.user_email}</a>
                      </div>
                      {lead.user_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <a href={`tel:${lead.user_phone}`} className="hover:underline">{lead.user_phone}</a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(lead.id)}
                        disabled={deleting === lead.id}
                        className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        {deleting === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWaitlist;
