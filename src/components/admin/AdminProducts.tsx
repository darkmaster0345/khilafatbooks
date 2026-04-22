import { useState, useRef, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, ImageIcon, Upload, Download, Save, Loader2, Cloud, Eye, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPKR } from '@/lib/currency';
import OptimizedImage from '../OptimizedImage';
import { resolveProductImage, getProductSrcSet, getProductPlaceholder } from '@/lib/productImages';
import { useProducts } from '@/hooks/useProducts';

const db = supabase as any;

const PRODUCT_CATEGORIES = [
  'Islamic History',
  'Quran & Tafsir',
  'Hadith Studies',
  'Contemporary Issues',
  'Children\'s Books',
  'Biographies',
  'Spiritual Growth',
  'Theology (Aqeedah)',
  'Digital Resources'
];

const AdminProducts = () => {
  const { products, loading, isError, error, refetch } = useProducts({ includeHidden: true });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    price: 0,
    original_price: 0,
    category: PRODUCT_CATEGORIES[0],
    type: 'physical',
    in_stock: true,
    is_new: false,
    is_halal: false,
    image_url: '',
    digital_file_url: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const digitalInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDigitalFile(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let finalImageUrl = form.image_url;
      let finalDigitalUrl = form.digital_file_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await db.storage.from('product-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = db.storage.from('product-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      if (digitalFile) {
        const fileExt = digitalFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await db.storage.from('digital-products').upload(fileName, digitalFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = db.storage.from('digital-products').getPublicUrl(fileName);
        finalDigitalUrl = publicUrl;
      }

      const payload = { ...form, image_url: finalImageUrl, digital_file_url: finalDigitalUrl };

      if (mode === 'add') {
        const { error } = await db.from('products').insert([payload] as any);
        if (error) throw error;
        toast({ title: 'Product created', description: 'Item has been added to catalog.' });
      } else {
        const { error } = await db.from('products').update(payload as any).eq('id', selected.id as any);
        if (error) throw error;
        toast({ title: 'Product updated', description: 'Changes saved successfully.' });
      }

      setMode('list');
      refetch();
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      setDeleting(id);
      const { error } = await supabase.from('products').delete().eq('id', id as any);
      if (error) throw error;
      refetch();
      toast({ title: 'Product deleted' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const openAdd = () => {
    setMode('add');
    setSelected(null);
    setImagePreview(null);
    setImageFile(null);
    setDigitalFile(null);
    setForm({
      name: '',
      name_ar: '',
      description: '',
      price: 0,
      original_price: 0,
      category: PRODUCT_CATEGORIES[0],
      type: 'physical',
      in_stock: true,
      is_new: false,
      is_halal: false,
      image_url: '',
      digital_file_url: ''
    });
  };

  const openEdit = (product: any) => {
    setMode('edit');
    setSelected(product);
    setImagePreview(product.image_url);
    setImageFile(null);
    setDigitalFile(null);
    setForm({
      name: product.name,
      name_ar: product.name_ar || '',
      description: product.description,
      price: product.price,
      original_price: product.original_price || 0,
      category: product.category,
      type: product.type,
      in_stock: product.in_stock,
      is_new: product.is_new,
      is_halal: product.is_halal,
      image_url: product.image_url,
      digital_file_url: product.digital_file_url || ''
    });
  };

  const allCategories = ['All', ...PRODUCT_CATEGORIES];
  const filtered = products.filter(p => {
    const nameMatch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    const categoryMatch = (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || categoryMatch;
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (mode !== 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setMode('list')} className="h-9 w-9 p-0 rounded-full"><Plus className="rotate-45" /></Button>
          <h2 className="font-display text-2xl font-bold text-foreground">{mode === 'add' ? 'New Product' : 'Edit Product'}</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5 bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div>
              <label className="text-sm font-medium text-foreground">Product Title *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Book title" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Arabic Title (Optional)</label>
              <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="mt-1 font-amiri" dir="rtl" placeholder="اسم الكتاب" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
                placeholder="Product details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Price (PKR) *</label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Original Price</label>
                <Input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Product Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_new} onChange={e => setForm({ ...form, is_new: e.target.checked })} className="rounded border-input" />
                <span className="text-sm font-medium">Mark as New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_halal} onChange={e => setForm({ ...form, is_halal: e.target.checked })} className="rounded border-input" />
                <span className="text-sm font-medium">Halal Certified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.in_stock} onChange={e => setForm({ ...form, in_stock: e.target.checked })} className="rounded border-input" />
                <span className="text-sm font-medium">In Stock</span>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground">Main Product Image</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="aspect-[2/3] w-32 shrink-0 rounded-xl border border-border bg-muted overflow-hidden">
                  {imagePreview ? (
                    <OptimizedImage src={resolveProductImage(imagePreview, 400)} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="space-y-2">
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="gap-1">
                    <Upload className="h-3 w-3" /> Upload Main Image
                  </Button>
                  <p className="text-[10px] text-muted-foreground">High resolution JPG or PNG recommended. (2:3 aspect ratio)</p>
                </div>
              </div>
            </div>

            {form.type === 'digital' && (
              <div>
                <label className="text-sm font-medium text-foreground">Digital File</label>
                <div className="mt-2">
                  <input ref={digitalInputRef} type="file" onChange={handleDigitalFileChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => digitalInputRef.current?.click()} className="gap-1">
                    <Download className="h-3 w-3" /> {digitalFile ? digitalFile.name : (form.digital_file_url ? 'Change Digital File' : 'Select Digital File')}
                  </Button>
                  {form.digital_file_url && !digitalFile && (
                    <p className="text-[10px] text-primary mt-1 flex items-center gap-1"><Download className="h-2.5 w-2.5" /> File already linked</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2 h-11 px-8 rounded-xl gold-gradient border-0 text-foreground font-bold shadow-lg mt-4">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : mode === 'add' ? 'Create Product' : 'Save Changes'}
        </Button>
      </div>
    );
  }

  const inStock = products.filter(p => p.in_stock).length;
  const digitalCount = products.filter(p => p.type === 'digital').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Product Catalog</h2>
          <p className="text-sm text-muted-foreground">Manage your store's items and digital assets.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAdd} className="gap-2 rounded-xl shadow-md"><Plus className="h-4 w-4" /> Add New</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Total" value={products.length} />
        <StatCard label="In Stock" value={inStock} />
        <StatCard label="Digital" value={digitalCount} />
        <StatCard label="Physical" value={products.length - digitalCount} />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search catalog..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl bg-card" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {allCategories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === c ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/30" /></div>
      ) : isError ? (
        <div className="py-20 text-center border-2 border-dashed border-destructive/30 rounded-3xl bg-destructive/5">
          <Package className="h-10 w-10 text-destructive/50 mx-auto mb-3" />
          <p className="text-destructive font-medium mb-2">Failed to load products</p>
          <p className="text-sm text-muted-foreground mb-4">{(error as any)?.message || 'Check RLS policies in Supabase'}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
          <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No items match your criteria</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map(product => (
            <div key={product.id} className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col">
              <div className="aspect-[2/3] relative overflow-hidden bg-muted">
                <OptimizedImage
                  src={resolveProductImage(product.image_url, 400)}
                  srcSet={getProductSrcSet(product.image_url)}
                  placeholder={getProductPlaceholder(product.image_url)}
                  alt={product.name}
                  className="w-full h-full transition-transform group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {product.is_new && <Badge className="bg-accent text-accent-foreground border-0 text-[10px] h-5">New</Badge>}
                  <Badge variant="outline" className="text-[10px] h-5 bg-card/80 backdrop-blur-md">{product.type}</Badge>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-display font-bold text-foreground text-sm line-clamp-2 h-[2.8em]">{product.name}</h3>
                  <span className="font-bold text-primary text-sm shrink-0">{formatPKR(product.price)}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-4 mt-1">{product.category}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                  <Badge className={product.in_stock ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                    {product.in_stock ? 'Active' : 'Sold Out'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(product)} className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)} disabled={deleting === product.id} className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value }: { label: string, value: number }) => (
  <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-black text-foreground">{value}</p>
  </div>
);

export default AdminProducts;
