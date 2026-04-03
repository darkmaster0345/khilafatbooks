import { SEOHead } from '@/components/SEOHead';
import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Book, BookOpen, CheckCircle2, Clock, Download, Plus, Trash2, StickyNote, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { formatPKR } from '@/lib/currency';
import { slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ReadingStatus = 'want_to_read' | 'reading' | 'completed';

interface LibraryItem {
  id: string;
  product_id: string;
  status: ReadingStatus;
  added_at: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

const statusConfig: Record<ReadingStatus, { label: string; icon: any; color: string }> = {
  want_to_read: { label: 'Want to Read', icon: Clock, color: 'bg-muted text-muted-foreground' },
  reading: { label: 'Reading', icon: BookOpen, color: 'bg-accent/20 text-accent-foreground' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-primary/20 text-primary' },
};

const Library = () => {
  const { user, loading: authLoading } = useAuth();
  const { products } = useProducts();
  const { toast } = useToast();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'all'>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [readingGoal, setReadingGoal] = useState(12);

  useEffect(() => {
    if (user) fetchLibrary();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const fetchLibrary = async () => {
    const { data, error } = await supabase
      .from('user_library')
      .select('*')
      .eq('user_id', user?.id)
      .order('added_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load library', variant: 'destructive' });
    } else {
      setLibrary(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (itemId: string, status: ReadingStatus) => {
    const { error } = await supabase
      .from('user_library')
      .update({
        status,
        ...(status === 'reading' && { started_at: new Date().toISOString() }),
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
      })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLibrary(prev => prev.map(i => i.id === itemId ? { ...i, status } : i));
      toast({ title: 'Status Updated', description: `Moved to ${statusConfig[status].label}` });
    }
  };

  const saveNotes = async (itemId: string) => {
    const { error } = await supabase
      .from('user_library')
      .update({ notes: noteText })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLibrary(prev => prev.map(i => i.id === itemId ? { ...i, notes: noteText } : i));
      setEditingNotes(null);
      toast({ title: 'Saved', description: 'Notes saved successfully' });
    }
  };

  const removeFromLibrary = async (itemId: string) => {
    const { error } = await supabase
      .from('user_library')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLibrary(prev => prev.filter(i => i.id !== itemId));
      toast({ title: 'Removed', description: 'Book removed from library' });
    }
  };

  const downloadDigital = async (productId: string) => {
    const { data, error } = await db.functions.invoke('download-digital-product', {
      body: { productId },
    });

    if (error || !data?.url) {
      toast({ title: 'Error', description: 'Could not generate download link', variant: 'destructive' });
    } else {
      window.open(data.url, '_blank');
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <SEOHead title="Your Digital Library | Khilafat Books" description="Access and download your purchased digital Islamic courses and books." canonical="/library" noIndex={true} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Loading your library...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const enrichedLibrary = library.map(item => ({
    ...item,
    product: products.find(p => p.id === item.product_id),
  }));

  const filtered = activeTab === 'all' 
    ? enrichedLibrary 
    : enrichedLibrary.filter(i => i.status === activeTab);

  const stats = {
    total: library.length,
    completed: library.filter(i => i.status === 'completed').length,
    reading: library.filter(i => i.status === 'reading').length,
  };

  return (
    <>
      <SEOHead title="Your Digital Library | Khilafat Books" description="Access and download your purchased digital Islamic courses and books." canonical="/library" noIndex={true} />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">My Library</h1>
            <p className="mt-2 text-muted-foreground">Track your progress and access your digital content.</p>
          </div>

          <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Yearly Goal</p>
              <p className="text-sm font-bold text-foreground">{stats.completed} / {readingGoal} Books</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-10">
           {(['all', 'want_to_read', 'reading', 'completed'] as const).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex flex-col p-4 rounded-2xl border transition-all text-left ${
                 activeTab === tab ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-4 ring-primary/10' : 'bg-card border-border hover:border-primary/30'
               }`}
             >
               <span className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{tab.replace(/_/g, ' ')}</span>
               <span className="text-2xl font-black">{tab === 'all' ? stats.total : stats[tab as keyof typeof stats] || 0}</span>
             </button>
           ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold">No books here yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Start adding books from our collection.</p>
            <Button asChild className="mt-6"><Link to="/shop">Browse Store</Link></Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {item.product?.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className={statusConfig[item.status].color}>{statusConfig[item.status].label}</Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-foreground line-clamp-1 mb-1">
                      {item.product?.name || 'Unknown Product'}
                    </h3>

                    <div className="flex items-center gap-4 mt-4 mb-6">
                      {item.status !== 'completed' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 rounded-lg text-xs"
                          onClick={() => updateStatus(item.id, item.status === 'want_to_read' ? 'reading' : 'completed')}
                        >
                          Mark {item.status === 'want_to_read' ? 'as Reading' : 'as Completed'}
                        </Button>
                      )}
                      {item.product?.type === 'digital' && (
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="flex-1 rounded-lg text-xs gap-2"
                          onClick={() => downloadDigital(item.product_id)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                       <button
                         onClick={() => { setEditingNotes(item.id); setNoteText(item.notes || ''); }}
                         className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                       >
                         <StickyNote className="h-3.5 w-3.5" /> {item.notes ? 'Edit Notes' : 'Add Notes'}
                       </button>
                       <button
                         onClick={() => removeFromLibrary(item.id)}
                         className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Dialog open={!!editingNotes} onOpenChange={(o) => !o && setEditingNotes(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Reading Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="What are your thoughts on this book?"
              className="min-h-[200px] rounded-xl"
            />
            <Button onClick={() => editingNotes && saveNotes(editingNotes)} className="w-full rounded-xl">Save Notes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Library;
