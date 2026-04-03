import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { formatPKR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

interface Discount {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

const AdminDiscounts = () => {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const { data } = await db.from('discounts').select('*').order('created_at', { ascending: false });
      if (data) setDiscounts(data as unknown as Discount[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createDiscount = async () => {
    if (!form.code || !form.value) {
      toast({ title: 'Missing fields', description: 'Code and value are required.', variant: 'destructive' });
      return;
    }
    const { error } = await db.from('discounts').insert({
      code: form.code.toUpperCase(),
      description: form.description || null,
      type: form.type,
      value: parseFloat(form.value),
      min_order_amount: form.min_order_amount ? parseInt(form.min_order_amount) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Created', description: `Discount ${form.code.toUpperCase()} created.` });
      setShowForm(false);
      setForm({ code: '', description: '', type: 'percentage', value: '', min_order_amount: '', max_uses: '', expires_at: '' });
      fetchDiscounts();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await db.from('discounts').update({ is_active: !isActive } as any).eq('id', id);
    if (!error) {
      setDiscounts(prev => prev.map(d => d.id === id ? { ...d, is_active: !isActive } : d));
      toast({ title: 'Updated', description: `Discount ${!isActive ? 'activated' : 'deactivated'}.` });
    }
  };

  const deleteDiscount = async (id: string) => {
    const { error } = await db.from('discounts').delete().eq('id', id);
    if (!error) {
      setDiscounts(prev => prev.filter(d => d.id !== id));
      toast({ title: 'Deleted', description: 'Discount removed.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Discounts</h2>
          <p className="text-sm text-muted-foreground">Create and manage discount codes.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> New Discount
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">New Discount Code</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Code *</label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="SUMMER20" className="mt-1 uppercase" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Summer sale discount" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (PKR)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Value *</label>
              <Input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '500'} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Min Order Amount</label>
              <Input type="number" value={form.min_order_amount} onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))} placeholder="0" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Max Uses</label>
              <Input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Expires At</label>
              <Input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={createDiscount}>Create Discount</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Discounts List */}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : discounts.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-border bg-card text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>No discount codes yet.</p>
          <p className="text-xs mt-1">Create your first discount code to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map(discount => (
            <div key={discount.id} className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                  <Tag className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{discount.code}</span>
                    <Badge className={discount.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}>
                      {discount.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {discount.type === 'percentage' ? `${discount.value}% off` : `${formatPKR(discount.value)} off`}
                    {discount.min_order_amount > 0 && ` • Min: ${formatPKR(discount.min_order_amount)}`}
                    {discount.max_uses && ` • ${discount.used_count}/${discount.max_uses} used`}
                    {discount.expires_at && ` • Expires: ${new Date(discount.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(discount.id, discount.is_active)}>
                  {discount.is_active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteDiscount(discount.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDiscounts;
