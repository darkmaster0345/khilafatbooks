import { useState, useRef, useCallback } from 'react';
import { Package, Plus, Edit, Trash2, Search, Save, X, Upload, Download, Cloud, FileUp, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useProducts, Product, PRODUCT_CATEGORIES } from '@/hooks/useProducts';
import { formatPKR } from '@/lib/currency';
import { resolveProductImage } from '@/lib/productImages';

type ProductForm = {
  name: string;
  name_ar: string;
  description: string;
  price: string;
  original_price: string;
  category: string;
  type: string;
  is_new: boolean;
  is_halal: boolean;
  ethical_source: string;
  in_stock: boolean;
  rating: string;
  reviews: string;
  series: string;
  series_order: string;
  bundle_discount: string;
};

const emptyForm: ProductForm = {
  name: '', name_ar: '', description: '', price: '', original_price: '',
  category: 'Uncategorized', type: 'physical', is_new: false, is_halal: false,
  ethical_source: '', in_stock: true, rating: '0', reviews: '0',
  series: '', series_order: '', bundle_discount: '100',
};

const formFromProduct = (p: Product): ProductForm => ({
  name: p.name,
  name_ar: p.name_ar || '',
  description: p.description,
  price: String(p.price),
  original_price: p.original_price ? String(p.original_price) : '',
  category: p.category,
  type: p.type,
  is_new: p.is_new,
  is_halal: p.is_halal,
  ethical_source: p.ethical_source || '',
  in_stock: p.in_stock,
  rating: String(p.rating),
  reviews: String(p.reviews),
  series: p.series || '',
  series_order: p.series_order ? String(p.series_order) : '',
  bundle_discount: p.bundle_discount ? String(p.bundle_discount) : '100',
});

const AdminProducts = () => {
  const { toast } = useToast();
  const { products, loading, refetch } = useProducts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const digitalInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [migrating, setMigrating] = useState(false);

  const localImageProducts = products.filter(p => p.image_url && p.image_url.startsWith('/product-'));

  const migrateToCloudinary = async () => {
    if (localImageProducts.length === 0) {
      toast({ title: 'Nothing to migrate', description: 'All images are already on CDN.' });
      return;
    }
    setMigrating(true);
    let migrated = 0;

    for (const product of localImageProducts) {
      try {
        const resolvedUrl = resolveProductImage(product.image_url);
        const response = await fetch(resolvedUrl);
        const blob = await response.blob();
        const file = new File([blob], `${product.id}.jpg`, { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');

        const { data, error } = await db.functions.invoke('upload-image', {
          body: formData,
        });

        if (!error && data?.success) {
          await db.from('products').update({ image_url: data.url }).eq('id', product.id);
          migrated++;
        }
      } catch (err) {
        console.error('Migration error:', err);
      }
    }

    setMigrating(false);
    toast({ title: 'Migration Complete', description: `Successfully migrated ${migrated} images to Cloudinary.` });
    refetch();
  };

  const openAdd = () => {
    setMode('add');
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview(null);
    setImageFile(null);
    setDigitalFile(null);
  };

  const openEdit = (p: Product) => {
    setMode('edit');
    setEditingId(p.id);
    setForm(formFromProduct(p));
    setImagePreview(resolveProductImage(p.image_url));
    setImageFile(null);
    setDigitalFile(null);
  };

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Product removed from catalog.' });
      refetch();
    }
    setDeleting(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: 'Required', description: 'Name and price are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);

    let image_url: string | undefined;
    let digital_file_url: string | undefined;

    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('folder', 'products');

      const { data: uploadData, error: uploadError } = await db.functions.invoke('upload-image', {
        body: formData,
      });

      if (uploadError || !uploadData?.success) {
        toast({ title: 'Image upload failed', description: uploadError?.message || uploadData?.error || 'Upload failed', variant: 'destructive' });
        setSaving(false);
        return;
      }
      image_url = uploadData.url;
    }

    if (digitalFile) {
      const ext = digitalFile.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await db.storage.from('digital-products').upload(path, digitalFile);
      if (upErr) {
        toast({ title: 'Digital file upload failed', description: upErr.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
      const { data: { publicUrl } } = db.storage.from('digital-products').getPublicUrl(path);
      digital_file_url = publicUrl;
    }

    const payload = {
      name: form.name,
      name_ar: form.name_ar || null,
      description: form.description,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      category: form.category,
      type: form.type,
      is_new: form.is_new,
      is_halal: form.is_halal,
      ethical_source: form.ethical_source || null,
      in_stock: form.in_stock,
      rating: parseFloat(form.rating || '0'),
      reviews: parseInt(form.reviews || '0'),
      series: form.series || null,
      series_order: form.series_order ? parseInt(form.series_order) : null,
      bundle_discount: form.bundle_discount ? parseInt(form.bundle_discount) : null,
      ...(image_url && { image_url }),
      ...(digital_file_url && { digital_file_url }),
    };

    const { error } = mode === 'add'
      ? await db.from('products').insert(payload as any)
      : await db.from('products').update(payload as any).eq('id', editingId!);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: mode === 'add' ? 'Added' : 'Updated', description: `Product ${mode === 'add' ? 'added' : 'updated'} successfully.` });
      setMode('list');
      refetch();
    }
    setSaving(false);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const allCategories = ['All', ...PRODUCT_CATEGORIES];

  if (mode !== 'list') {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {mode === 'add' ? 'Add New Product' : 'Edit Product'}
            </h2>
            <p className="text-sm text-muted-foreground">Fill in the details for your storefront.</p>
          </div>
          <Button variant="ghost" onClick={() => setMode('list')} className="rounded-xl">
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Product Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="e.g. Premium Prayer Mat" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Arabic Name (Optional)</label>
              <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="mt-1 text-right font-arabic" placeholder="اسم المنتج" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Product details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Price (PKR)</label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Original Price</label>
                <Input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} className="mt-1" />
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
                <div className="h-32 w-32 shrink-0 rounded-xl border border-border bg-muted overflow-hidden">
                  {imagePreview ? <img src={imagePreview} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /></div>}
                </div>
                <div className="space-y-2">
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="gap-1">
                    <Upload className="h-3 w-3" /> Upload Main Image
                  </Button>
                  <p className="text-[10px] text-muted-foreground">High resolution JPG or PNG recommended.</p>
                </div>
              </div>
            </div>

            {form.type === 'digital' && (
              <div>
                <label className="text-sm font-medium text-foreground">Digital File</label>
                <div className="mt-2">
                  <input ref={digitalInputRef} type="file" onChange={handleDigitalFileChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => digitalInputRef.current?.click()} className="gap-1">
                    <Download className="h-3 w-3" /> {digitalFile ? digitalFile.name : 'Select Digital File'}
                  </Button>
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
          {localImageProducts.length > 0 && (
            <Button variant="outline" onClick={migrateToCloudinary} disabled={migrating} className="gap-2 rounded-xl">
              <Cloud className="h-4 w-4" /> {migrating ? '...' : `CDN Sync (${localImageProducts.length})`}
            </Button>
          )}
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
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
          <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No items match your criteria</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(product => (
            <div key={product.id} className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="aspect-square relative overflow-hidden bg-muted">
                <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {product.is_new && <Badge className="bg-accent text-accent-foreground border-0 text-[10px] h-5">New</Badge>}
                  <Badge variant="outline" className="text-[10px] h-5 bg-card/80 backdrop-blur-md">{product.type}</Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-display font-bold text-foreground text-sm line-clamp-1">{product.name}</h3>
                  <span className="font-bold text-primary text-sm shrink-0">{formatPKR(product.price)}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-4">{product.category}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
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
