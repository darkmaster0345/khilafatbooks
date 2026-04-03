import { useState, useEffect } from 'react';
import { Settings, Save, Store, CreditCard, Truck, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AdminSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    easypaisa_account: '03352706540',
    easypaisa_name: 'Khilafat Books',
    free_shipping_threshold: '5000',
    shipping_fee: '500',
    whatsapp_number: '923352706540',
    store_email: 'support@khilafatbooks.com',
    zakat_enabled: true,
    zakat_rate: '2.5',
    order_prefix: 'KB',
    maintenance_mode: false,
  });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await db.from('store_settings').select('*').eq('key', 'general');
      if (data && data.length > 0) {
        const saved = (data[0] as any).value;
        setSettings(prev => ({ ...prev, ...saved }));
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await db.from('store_settings').upsert({
      key: 'general',
      value: settings as any,
    } as any, { onConflict: 'key' });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Settings saved successfully.' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your store settings.</p>
      </div>

      {/* Maintenance Mode */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">Maintenance Mode</h3>
              <p className="text-xs text-muted-foreground">Notify users that orders and contact may take time.</p>
            </div>
          </div>
          <Switch
            checked={settings.maintenance_mode}
            onCheckedChange={(val) => setSettings(p => ({ ...p, maintenance_mode: val }))}
          />
        </div>
      </div>

      {/* Store Info */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Store Information</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Store Email</label>
            <Input value={settings.store_email} onChange={e => setSettings(p => ({ ...p, store_email: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">WhatsApp Number</label>
            <Input value={settings.whatsapp_number} onChange={e => setSettings(p => ({ ...p, whatsapp_number: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Order ID Prefix</label>
            <Input value={settings.order_prefix} onChange={e => setSettings(p => ({ ...p, order_prefix: e.target.value }))} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Payment Settings</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">EasyPaisa Account</label>
            <Input value={settings.easypaisa_account} onChange={e => setSettings(p => ({ ...p, easypaisa_account: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Account Title</label>
            <Input value={settings.easypaisa_name} onChange={e => setSettings(p => ({ ...p, easypaisa_name: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.zakat_enabled}
              onChange={e => setSettings(p => ({ ...p, zakat_enabled: e.target.checked }))}
              className="rounded border-input"
            />
            <span className="text-sm text-foreground">Enable Zakat option at checkout</span>
          </label>
          {settings.zakat_enabled && (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={settings.zakat_rate}
                onChange={e => setSettings(p => ({ ...p, zakat_rate: e.target.value }))}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Shipping Settings</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Default Shipping Fee (PKR)</label>
            <Input type="number" value={settings.shipping_fee} onChange={e => setSettings(p => ({ ...p, shipping_fee: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Free Shipping Threshold (PKR)</label>
            <Input type="number" value={settings.free_shipping_threshold} onChange={e => setSettings(p => ({ ...p, free_shipping_threshold: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">Note: Individual per-product delivery fees set in Product catalog will override this or be added if applicable.</p>
      </div>

      {/* Admin Account */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Admin Account</h3>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-muted-foreground">Logged in as: <span className="text-foreground font-medium">{user?.email}</span></p>
          <p className="text-muted-foreground">Role: <span className="text-primary font-medium">Administrator</span></p>
        </div>
      </div>

      <Button onClick={saveSettings} disabled={saving} size="lg" className="gap-1">
        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save All Settings'}
      </Button>
    </div>
  );
};

export default AdminSettings;
