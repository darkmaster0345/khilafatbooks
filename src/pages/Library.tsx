import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Book, BookOpen, CheckCircle2, Clock, Download, Plus, Trash2, StickyNote, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

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
  }, [user]);

  const fetchLibrary = async () => {
    const { data, error } = await supabase
      .from('user_library')
      .select('*')
      .eq('user_id', user!.id)
      .order('added_at', { ascending: false });
    
    if (!error && data) {
      setLibrary(data as LibraryItem[]);
    }
    setLoading(false);
  };

  const updateStatus = async (itemId: string, newStatus: ReadingStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'reading' && !library.find(i => i.id === itemId)?.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('user_library')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLibrary(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
      toast({ title: 'Updated', description: `Status changed to ${statusConfig[newStatus].label}` });
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
    const { data, error } = await supabase.functions.invoke('download-digital-product', {
      body: { productId },
    });

    if (error || !data?.url) {
      toast({ title: 'Error', description: 'Could not generate download link', variant: 'destructive' });
    } else {
      window.open(data.url, '_blank');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your library...</p>
        </div>
      </div>
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
    wantToRead: library.filter(i => i.status === 'want_to_read').length,
  };

  const completionPercent = readingGoal > 0 ? Math.min(100, (stats.completed / readingGoal) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>My Library | Khilafat Books</title>
        <meta name="description" content="Track your reading journey with Khilafat Books. Manage your digital books and set reading goals." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">My Reading Journey</h1>
            <p className="mt-1 text-muted-foreground">Track your progress and build your Islamic knowledge library</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Book className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Books</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <BookOpen className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">{stats.reading}</p>
                  <p className="text-xs text-muted-foreground">Currently Reading</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </div>

            {/* Reading Goal */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Reading Goal</span>
                </div>
                <span className="text-xs text-muted-foreground">{stats.completed}/{readingGoal}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <motion.div 
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-2 text-lg font-bold font-display text-foreground">
                {completionPercent.toFixed(0)}% <span className="text-xs font-normal text-muted-foreground">complete</span>
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(['all', 'want_to_read', 'reading', 'completed'] as const).map(tab => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="shrink-0"
              >
                {tab === 'all' ? 'All' : statusConfig[tab].label}
                {tab !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({tab === 'want_to_read' ? stats.wantToRead : tab === 'reading' ? stats.reading : stats.completed})
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Library Grid */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading your library...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Book className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {activeTab === 'all' ? 'Your library is empty' : `No ${statusConfig[activeTab as ReadingStatus].label.toLowerCase()} books`}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Books you purchase will automatically appear here once delivered
              </p>
              <Button asChild>
                <Link to="/shop">Browse Books</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-xl border border-border bg-card overflow-hidden group"
                  >
                    {/* Book Image */}
                    <Link to={`/product/${item.product_id}`} className="block aspect-[4/3] overflow-hidden bg-muted">
                      {item.product?.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Book className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </Link>

                    <div className="p-4">
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {item.product?.name || 'Unknown Book'}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(item.added_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={statusConfig[item.status].color}>
                          {statusConfig[item.status].label}
                        </Badge>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex gap-1 mb-3">
                        {(['want_to_read', 'reading', 'completed'] as ReadingStatus[]).map(status => {
                          const config = statusConfig[status];
                          const Icon = config.icon;
                          const isActive = item.status === status;
                          return (
                            <Button
                              key={status}
                              variant={isActive ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1 text-xs px-2"
                              onClick={() => updateStatus(item.id, status)}
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {status === 'want_to_read' ? 'Want' : status === 'reading' ? 'Reading' : 'Done'}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Notes Section */}
                      {editingNotes === item.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Add your notes, favorite quotes..."
                            className="text-sm min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveNotes(item.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : item.notes ? (
                        <button 
                          onClick={() => { setEditingNotes(item.id); setNoteText(item.notes || ''); }}
                          className="w-full text-left p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors mb-3"
                        >
                          <StickyNote className="h-3 w-3 inline mr-1" />
                          {item.notes.slice(0, 80)}{item.notes.length > 80 ? '...' : ''}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setEditingNotes(item.id); setNoteText(''); }}
                          className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add notes
                        </button>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        {item.product?.type === 'digital' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 gap-1"
                            onClick={() => downloadDigital(item.product_id)}
                          >
                            <Download className="h-3 w-3" /> Download
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeFromLibrary(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Library;
