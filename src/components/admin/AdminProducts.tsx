import { useState, useRef, useCallback } from 'react';
import { Package, Plus, Edit, Trash2, Search, Save, X, Upload, Download, Cloud, FileUp, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  delivery_price: string;
};

const emptyForm: ProductForm = {
  name: '', name_ar: '', description: '', price: '', original_price: '',
  category: 'Uncategorized', type: 'physical', is_new: false, is_halal: false,
  ethical_source: '', in_stock: true, rating: '0', reviews: '0',
  series: '', series_order: '', bundle_discount: '100', delivery_price: '',
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
  series: (p as any).series || '',
  series_order: (p as any).series_order ? String((p as any).series_order) : '',
  bundle_discount: (p as any).bundle_discount ? String((p as any).bundle_discount) : '100',
  delivery_price: (p as any).delivery_price != null ? String((p as any).delivery_price) : '',
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
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

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
        // Fetch the local image as a blob
        const resolvedUrl = resolveProductImage(product.image_url);
        const response = await fetch(resolvedUrl);
        const blob = await response.blob();
        const file = new File([blob], `${product.id}.jpg`, { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-image', {
          body: formData,
        });

        if (uploadError || !uploadData?.success) {
          console.error(`Failed to migrate ${product.name}:`, uploadError || uploadData?.error);
          continue;
        }

        // Update the product's image_url in the database
        await supabase.from('products').update({ image_url: uploadData.url } as any).eq('id', product.id);
        migrated++;
      } catch (err) {
        console.error(`Error migrating ${product.name}:`, err);
      }
    }

    toast({
      title: '🎉 Migration Complete',
      description: `${migrated}/${localImageProducts.length} images migrated to Cloudinary CDN.`,
    });
    setMigrating(false);
    refetch();
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const allCategories = ['All', ...PRODUCT_CATEGORIES];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDigitalFile(file);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setDigitalFile(null);
    setEditingId(null);
    setMode('add');
  };

  const openEdit = (p: Product) => {
    setForm(formFromProduct(p));
    setEditingId(p.id);
    setImageFile(null);
    setImagePreview(p.image_url || null);
    setDigitalFile(null);
    setMode('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: 'Required', description: 'Name and price are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);

    let image_url: string | undefined;
    let digital_file_url: string | undefined;

    // Upload product image to Cloudinary
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('folder', 'products');

      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-image', {
        body: formData,
      });

      if (uploadError || !uploadData?.success) {
        toast({ title: 'Image upload failed', description: uploadError?.message || uploadData?.error || 'Upload failed', variant: 'destructive' });
        setSaving(false);
        return;
      }
      image_url = uploadData.url;
    }

    // Upload digital file
    if (digitalFile) {
      const ext = digitalFile.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('digital-products').upload(path, digitalFile);
      if (upErr) {
        toast({ title: 'Digital file upload failed', description: upErr.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
      digital_file_url = path;
    }

    const payload: any = {
      name: form.name,
      name_ar: form.name_ar || null,
      description: form.description,
      price: parseInt(form.price) || 0,
      original_price: form.original_price ? parseInt(form.original_price) : null,
      category: form.category,
      type: form.type,
      is_new: form.is_new,
      is_halal: form.is_halal,
      ethical_source: form.ethical_source || null,
      in_stock: form.in_stock,
      rating: parseFloat(form.rating) || 0,
      reviews: parseInt(form.reviews) || 0,
      series: form.series || null,
      series_order: form.series_order ? parseInt(form.series_order) : null,
      bundle_discount: form.bundle_discount ? parseInt(form.bundle_discount) : 100,
    };

    if (image_url) payload.image_url = image_url;
    if (digital_file_url) payload.digital_file_url = digital_file_url;

    if (mode === 'edit' && editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Updated', description: 'Product updated successfully.' });
        setMode('list');
      }
    } else {
      if (!image_url) payload.image_url = '/placeholder.svg';
      const { error } = await supabase.from('products').insert(payload);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Added', description: 'Product added successfully.' });
        setMode('list');
      }
    }

    setSaving(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Product removed successfully.' });
      refetch();
    }
    setDeleting(null);
  };

  const updateField = (key: keyof ProductForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // CSV Import logic
  const parseCSV = useCallback((text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return { rows: [], errors: ['CSV must have a header row and at least one data row.'] };
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['name', 'price'];
    const missingHeaders = required.filter(r => !headers.includes(r));
    if (missingHeaders.length) return { rows: [], errors: [`Missing required columns: ${missingHeaders.join(', ')}`] };

    const rows: any[] = [];
    const errors: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        errors.push(`Row ${i}: column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }
      const row: any = {};
      headers.forEach((h, j) => { row[h] = values[j]; });
      if (!row.name) { errors.push(`Row ${i}: missing name`); continue; }
      if (!row.price || isNaN(Number(row.price))) { errors.push(`Row ${i}: invalid price`); continue; }
      rows.push({
        name: row.name,
        description: row.description || '',
        price: parseInt(row.price),
        original_price: row.original_price ? parseInt(row.original_price) : null,
        category: PRODUCT_CATEGORIES.includes(row.category || '') ? row.category : 'Uncategorized',
        type: ['physical', 'digital'].includes(row.type || '') ? row.type : 'physical',
        is_new: row.is_new === 'true',
        is_halal: row.is_halal === 'true',
        in_stock: row.in_stock !== 'false',
        rating: parseFloat(row.rating) || 0,
        reviews: parseInt(row.reviews) || 0,
        series: row.series || null,
        image_url: row.image_url || '/placeholder.svg',
      });
    }
    return { rows, errors };
  }, []);

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setCsvPreview(rows);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const importCSV = async () => {
    if (!csvPreview || csvPreview.length === 0) return;
    setCsvImporting(true);
    const { error } = await supabase.from('products').insert(csvPreview);
    if (error) {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Import complete', description: `${csvPreview.length} products imported successfully.` });
      setCsvPreview(null);
      setCsvErrors([]);
      refetch();
    }
    setCsvImporting(false);
  };

  // Product form view
  if (mode !== 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {mode === 'add' ? 'Add Product' : 'Edit Product'}
          </h2>
          <Button variant="ghost" onClick={() => setMode('list')}><X className="h-4 w-4 mr-1" /> Cancel</Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-5">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Product Name *</label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)} className="mt-1" placeholder="e.g. Premium Tasbih" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Arabic Name</label>
              <Input value={form.name_ar} onChange={e => updateField('name_ar', e.target.value)} className="mt-1 font-arabic" placeholder="الاسم بالعربية" dir="rtl" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[100px]"
              placeholder="Product description..."
            />
          </div>

          {/* Price & Category */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-foreground">Price (PKR) *</label>
              <Input value={form.price} onChange={e => updateField('price', e.target.value)} type="number" className="mt-1" placeholder="4999" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Original Price (for discount)</label>
              <Input value={form.original_price} onChange={e => updateField('original_price', e.target.value)} type="number" className="mt-1" placeholder="6500" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                value={form.category}
                onChange={e => updateField('category', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Type */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-foreground">Product Type</label>
              <select
                value={form.type}
                onChange={e => updateField('type', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="physical">📦 Physical</option>
                <option value="digital">💾 Digital</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Rating</label>
              <Input value={form.rating} onChange={e => updateField('rating', e.target.value)} type="number" step="0.1" min="0" max="5" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Reviews Count</label>
              <Input value={form.reviews} onChange={e => updateField('reviews', e.target.value)} type="number" className="mt-1" />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.in_stock} onChange={e => updateField('in_stock', e.target.checked)} className="rounded border-input" />
              <span className="text-sm text-foreground">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_new} onChange={e => updateField('is_new', e.target.checked)} className="rounded border-input" />
              <span className="text-sm text-foreground">New Arrival</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_halal} onChange={e => updateField('is_halal', e.target.checked)} className="rounded border-input" />
              <span className="text-sm text-foreground">Halal Certified</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Ethical Sourcing Note</label>
            <Input value={form.ethical_source} onChange={e => updateField('ethical_source', e.target.value)} className="mt-1" placeholder="e.g. Fair-trade certified" />
          </div>

          {/* Series / Bundle fields */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-foreground">Series Name</label>
              <Input value={form.series} onChange={e => updateField('series', e.target.value)} className="mt-1" placeholder="e.g. Khilafat Series" />
              <p className="text-[10px] text-muted-foreground mt-1">Group books into sets for "Complete the Set" upsell</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Series Order</label>
              <Input value={form.series_order} onChange={e => updateField('series_order', e.target.value)} type="number" className="mt-1" placeholder="1, 2, 3..." />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Bundle Discount (PKR)</label>
              <Input value={form.bundle_discount} onChange={e => updateField('bundle_discount', e.target.value)} type="number" className="mt-1" placeholder="100" />
              <p className="text-[10px] text-muted-foreground mt-1">Discount per book when added via bundle</p>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="text-sm font-medium text-foreground">Product Image</label>
            <div className="mt-2 flex items-start gap-4">
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-md object-cover border border-border" />
              )}
              <div>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="gap-1">
                  <Upload className="h-3 w-3" /> {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>
            </div>
          </div>

          {/* Digital file upload (only for digital products) */}
          {form.type === 'digital' && (
            <div>
              <label className="text-sm font-medium text-foreground">Digital File (PDF, ZIP, etc.)</label>
              <div className="mt-2">
                <input ref={digitalInputRef} type="file" onChange={handleDigitalFileChange} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => digitalInputRef.current?.click()} className="gap-1">
                  <Download className="h-3 w-3" /> {digitalFile ? digitalFile.name : 'Upload Digital File'}
                </Button>
                {digitalFile && <span className="ml-2 text-xs text-muted-foreground">{digitalFile.name}</span>}
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : mode === 'add' ? 'Add Product' : 'Save Changes'}
        </Button>
      </div>
    );
  }

  // List view
  const inStock = products.filter(p => p.in_stock).length;
  const digitalCount = products.filter(p => p.type === 'digital').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">Manage your product catalog.</p>
        </div>
        <div className="flex gap-2">
          {localImageProducts.length > 0 && (
            <Button variant="outline" onClick={migrateToCloudinary} disabled={migrating} className="gap-1">
              <Cloud className="h-4 w-4" /> {migrating ? 'Migrating...' : `Migrate ${localImageProducts.length} to CDN`}
            </Button>
          )}
          <Button onClick={openAdd} className="gap-1"><Plus className="h-4 w-4" /> Add Product</Button>
          <div>
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
            <Button variant="outline" onClick={() => csvInputRef.current?.click()} className="gap-1">
              <FileUp className="h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-foreground">{products.length}</p>
          <p className="text-xs text-muted-foreground">Total Products</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-primary">{inStock}</p>
          <p className="text-xs text-muted-foreground">In Stock</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-foreground">{digitalCount}</p>
          <p className="text-xs text-muted-foreground">Digital</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold font-display text-accent">{products.length - digitalCount}</p>
          <p className="text-xs text-muted-foreground">Physical</p>
        </div>
      </div>

      {/* CSV Preview */}
      {csvPreview && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">
              CSV Preview — {csvPreview.length} products ready to import
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setCsvPreview(null); setCsvErrors([]); }}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={importCSV} disabled={csvImporting || csvPreview.length === 0} className="gap-1">
                {csvImporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Import {csvPreview.length} Products
              </Button>
            </div>
          </div>
          {csvErrors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 space-y-1">
              {csvErrors.map((err, i) => (
                <p key={i} className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> {err}
                </p>
              ))}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="px-2 py-1 text-left text-muted-foreground">Name</th>
                  <th className="px-2 py-1 text-left text-muted-foreground">Price</th>
                  <th className="px-2 py-1 text-left text-muted-foreground">Category</th>
                  <th className="px-2 py-1 text-left text-muted-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="px-2 py-1 text-foreground">{row.name}</td>
                    <td className="px-2 py-1 text-foreground">{formatPKR(row.price)}</td>
                    <td className="px-2 py-1 text-muted-foreground">{row.category}</td>
                    <td className="px-2 py-1 text-muted-foreground">{row.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvPreview.length > 10 && (
              <p className="text-center text-[10px] text-muted-foreground py-1">...and {csvPreview.length - 10} more</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allCategories.map(c => (
            <Button key={c} variant={categoryFilter === c ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No products found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(product => (
            <div key={product.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square relative">
                <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  {product.is_new && <Badge className="bg-accent text-accent-foreground text-xs">New</Badge>}
                  <Badge variant="outline" className="text-xs bg-card/80 backdrop-blur-sm">{product.type}</Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-foreground text-sm">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{formatPKR(product.price)}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through">{formatPKR(product.original_price)}</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge className={product.in_stock ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}>
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(product)} className="gap-1 text-xs">
                      <Edit className="h-3 w-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="gap-1 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> {deleting === product.id ? '...' : 'Delete'}
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

export default AdminProducts;
