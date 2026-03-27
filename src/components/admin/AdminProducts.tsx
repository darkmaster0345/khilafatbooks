import { useState, useRef, useCallback } from 'react';
import { Package, Plus, Edit, Trash2, Search, Save, X, Upload, Download, Cloud, FileUp, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
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
  delivery_fee: string;
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
  image_urls: string[];
};

const emptyForm: ProductForm = {
  name: '', name_ar: '', description: '', price: '', original_price: '', delivery_fee: '0',
  category: 'Uncategorized', type: 'physical', is_new: false, is_halal: false,
  ethical_source: '', in_stock: true, rating: '0', reviews: '0',
  series: '', series_order: '', bundle_discount: '100', image_urls: ['', '', '', ''],
};

const formFromProduct = (p: Product): ProductForm => ({
  name: p.name,
  name_ar: p.name_ar || '',
  description: p.description,
  price: String(p.price),
  original_price: p.original_price ? String(p.original_price) : '',
  delivery_fee: String(p.delivery_fee || 0),
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
  image_urls: (p as any).image_urls && (p as any).image_urls.length > 0
    ? [...(p as any).image_urls, '', '', '', ''].slice(0, 4)
    : ['', '', '', ''],
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

    if (digitalFile) {
      const ext = digitalFile.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('digital-products').upload(path, digitalFile);
      if (upErr) {
        toast({ title: 'Digital file upload failed', description: upErr.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('digital-products').getPublicUrl(path);
      digital_file_url = publicUrl;
    }

    const payload = {
      name: form.name,
      name_ar: form.name_ar || null,
      description: form.description,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      delivery_fee: parseFloat(form.delivery_fee || '0'),
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
      image_urls: form.image_urls.filter(url => url.trim() !== ''),
      ...(image_url && { image_url }),
      ...(digital_file_url && { digital_file_url }),
    };

    const { error } = mode === 'add'
      ? await supabase.from('products').insert(payload as any)
      : await supabase.from('products').update(payload as any).eq('id', editingId!);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: mode === 'add' ? 'Added' : 'Updated', description: `Product ${mode === 'add' ? 'added' : 'updated'} successfully.` });
      setMode('list');
      refetch();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Product deleted successfully.' });
      refetch();
    }
    setDeleting(null);
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const results = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',');
        if (values.length < headers.length) {
          errors.push(`Row ${i} is malformed`);
          continue;
        }
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h.trim()] = values[idx].trim();
        });
        results.push(obj);
      }
      setCsvPreview(results);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const importCSV = async () => {
    if (!csvPreview) return;
    setCsvImporting(true);
    const products = csvPreview.map(p => ({
      name: p.name,
      name_ar: p.name_ar || null,
      description: p.description || '',
      price: parseFloat(p.price || '0'),
      original_price: p.original_price ? parseFloat(p.original_price) : null,
      delivery_fee: parseFloat(p.delivery_fee || '0'),
      category: p.category || 'Uncategorized',
      type: p.type || 'physical',
      in_stock: p.in_stock === 'true',
      is_new: p.is_new === 'true',
      is_halal: p.is_halal === 'true',
      ethical_source: p.ethical_source || null,
    }));

    const { error } = await supabase.from('products').insert(products as any);
    if (error) {
      toast({ title: 'CSV Import Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Imported ${products.length} products successfully.` });
      setCsvPreview(null);
      refetch();
    }
    setCsvImporting(false);
  };

  if (mode === 'add' || mode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setMode('list')}><X className="h-4 w-4" /></Button>
          <h2 className="font-display text-2xl font-bold text-foreground">{mode === 'add' ? 'Add Product' : 'Edit Product'}</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Product Name *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Arabic Name</label>
              <Input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} className="mt-1 font-amiri text-right" dir="rtl" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Price (PKR) *</label>
                <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Original Price</label>
                <Input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Delivery Fee (PKR)</label>
                <Input type="number" value={form.delivery_fee} onChange={e => setForm(p => ({ ...p, delivery_fee: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="physical">Physical Product</option>
                  <option value="digital">Digital Product</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_new} onChange={e => setForm(p => ({ ...p, is_new: e.target.checked }))} className="rounded border-input" />
                <span className="text-sm text-foreground">New Arrival</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_halal} onChange={e => setForm(p => ({ ...p, is_halal: e.target.checked }))} className="rounded border-input" />
                <span className="text-sm text-foreground">Halal Certified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.in_stock} onChange={e => setForm(p => ({ ...p, in_stock: e.target.checked }))} className="rounded border-input" />
                <span className="text-sm text-foreground">In Stock</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Main Product Image</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <img src={imagePreview || '/placeholder.svg'} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="gap-1">
                    <Upload className="h-3 w-3" /> {imagePreview ? 'Change Image' : 'Upload Image'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Gallery Images (Up to 4 URLs)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {form.image_urls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <Input
                      placeholder="https://images.cloudinary.com/..."
                      value={url}
                      onChange={e => {
                        const newUrls = [...form.image_urls];
                        newUrls[i] = e.target.value;
                        setForm(p => ({ ...p, image_urls: newUrls }));
                      }}
                      className="h-9 text-xs"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground italic">Add up to 4 additional image URLs for the product gallery.</p>
            </div>

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
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : mode === 'add' ? 'Add Product' : 'Save Changes'}
        </Button>
      </div>
    );
  }

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
