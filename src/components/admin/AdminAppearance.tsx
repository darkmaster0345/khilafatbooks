import { useState, useEffect } from 'react';
import { Palette, Type, Image, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminAppearance = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    store_name: 'Khilafat Books',
    store_tagline: 'Islamic Bookstore',
    store_description: 'Ethically sourced, halal-certified Islamic books and products for the modern Muslim lifestyle.',
    primary_color: '#064e3b',
    accent_color: '#d4af37',
    announcement_bar: '',
    announcement_active: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('store_settings').select('*').eq('key', 'appearance');
      if (data && data.length > 0) {
        const saved = (data[0] as any).value;
        setSettings(prev => ({ ...prev, ...saved }));
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase.from('store_settings').upsert({
      key: 'appearance',
      value: settings as any,
    } as any, { onConflict: 'key' });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Appearance settings saved successfully.' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground">Customize your store's look and feel.</p>
      </div>

      {/* Brand Identity */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Brand Identity</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Store Name</label>
            <Input value={settings.store_name} onChange={e => setSettings(p => ({ ...p, store_name: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Tagline</label>
            <Input value={settings.store_tagline} onChange={e => setSettings(p => ({ ...p, store_tagline: e.target.value }))} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={settings.store_description}
              onChange={e => setSettings(p => ({ ...p, store_description: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[80px]"
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Colors</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Primary Color</label>
            <div className="mt-1 flex items-center gap-3">
              <input type="color" value={settings.primary_color} onChange={e => setSettings(p => ({ ...p, primary_color: e.target.value }))} className="h-10 w-16 rounded border border-input cursor-pointer" />
              <Input value={settings.primary_color} onChange={e => setSettings(p => ({ ...p, primary_color: e.target.value }))} className="flex-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Accent Color</label>
            <div className="mt-1 flex items-center gap-3">
              <input type="color" value={settings.accent_color} onChange={e => setSettings(p => ({ ...p, accent_color: e.target.value }))} className="h-10 w-16 rounded border border-input cursor-pointer" />
              <Input value={settings.accent_color} onChange={e => setSettings(p => ({ ...p, accent_color: e.target.value }))} className="flex-1" />
            </div>
          </div>
        </div>
        {/* Color Preview */}
        <div className="flex gap-3">
          <div className="rounded-lg p-4 flex-1 text-center text-sm font-medium" style={{ backgroundColor: settings.primary_color, color: '#fff' }}>Primary</div>
          <div className="rounded-lg p-4 flex-1 text-center text-sm font-medium" style={{ backgroundColor: settings.accent_color, color: '#000' }}>Accent</div>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Announcement Bar</h3>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.announcement_active}
              onChange={e => setSettings(p => ({ ...p, announcement_active: e.target.checked }))}
              className="rounded border-input"
            />
            <span className="text-sm text-foreground">Enable announcement bar</span>
          </label>
        </div>
        <Input
          value={settings.announcement_bar}
          onChange={e => setSettings(p => ({ ...p, announcement_bar: e.target.value }))}
          placeholder="e.g. Free shipping on orders over Rs. 5,000!"
          disabled={!settings.announcement_active}
        />
        {settings.announcement_active && settings.announcement_bar && (
          <div className="rounded-md p-3 text-center text-sm font-medium" style={{ backgroundColor: settings.primary_color, color: '#fff' }}>
            {settings.announcement_bar}
          </div>
        )}
      </div>

      <Button onClick={saveSettings} disabled={saving} className="gap-1">
        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Appearance'}
      </Button>
    </div>
  );
};

export default AdminAppearance;
