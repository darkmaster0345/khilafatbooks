import { Settings, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { usePluginSettings, PluginName } from '@/hooks/usePluginSettings';
import { useToast } from '@/hooks/use-toast';

interface PluginDef {
  key: PluginName;
  name: string;
  description: string;
  icon: string;
  category: string;
  available: boolean;
}

const plugins: PluginDef[] = [
  {
    key: 'whatsapp_notifications',
    name: 'WhatsApp Notifications',
    description: 'Automatically notify customers about order status via WhatsApp.',
    icon: '💬',
    category: 'Notifications',
    available: true,
  },
  {
    key: 'easypaisa_payments',
    name: 'EasyPaisa Payments',
    description: 'Manual EasyPaisa payment verification for Pakistani customers.',
    icon: '💳',
    category: 'Payments',
    available: true,
  },
  {
    key: 'zakat_calculator',
    name: 'Zakat Calculator',
    description: 'Allows customers to add optional Zakat (2.5%) at checkout.',
    icon: '🕌',
    category: 'Checkout',
    available: true,
  },
  {
    key: 'ai_chat',
    name: 'AI Chat Assistant',
    description: 'AI-powered chat widget to help customers with questions.',
    icon: '🤖',
    category: 'Support',
    available: true,
  },
  {
    key: 'email_notifications',
    name: 'Email Notifications',
    description: 'Send order confirmations and updates via email.',
    icon: '📧',
    category: 'Notifications',
    available: true,
  },
  {
    key: 'sms_alerts',
    name: 'SMS Alerts',
    description: 'Send SMS notifications for order updates and promotions.',
    icon: '📱',
    category: 'Notifications',
    available: false,
  },
  {
    key: 'jazzcash_payments',
    name: 'JazzCash Payments',
    description: 'Accept payments via JazzCash mobile wallet.',
    icon: '💰',
    category: 'Payments',
    available: false,
  },
  {
    key: 'inventory_tracking',
    name: 'Inventory Tracking',
    description: 'Automated stock management and low-stock alerts.',
    icon: '📦',
    category: 'Inventory',
    available: false,
  },
  {
    key: 'seo_tools',
    name: 'SEO Tools',
    description: 'Optimize product pages for search engines.',
    icon: '🔍',
    category: 'Marketing',
    available: false,
  },
];

import { useState, useEffect } from 'react';

const AdminPlugins = () => {
  const { isPluginEnabled, togglePlugin, isLoading: queryLoading, isToggling } = usePluginSettings();
  const { toast } = useToast();
  const [timeoutLoading, setTimeoutLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTimeoutLoading(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = queryLoading && timeoutLoading;

  const availablePlugins = plugins.filter(p => p.available);
  const comingSoon = plugins.filter(p => !p.available);

  const handleToggle = (plugin: PluginDef, enabled: boolean) => {
    togglePlugin(plugin.key, enabled);
    toast({
      title: enabled ? `${plugin.name} enabled` : `${plugin.name} disabled`,
      description: enabled
        ? 'This plugin is now active on your store.'
        : 'This plugin has been deactivated.',
    });
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Plugins</h2>
        <p className="text-sm text-muted-foreground">Toggle features on/off to customize your store.</p>
      </div>

      {/* Available Plugins */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Available Plugins</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availablePlugins.map(plugin => {
            const enabled = isPluginEnabled(plugin.key);
            return (
              <div
                key={plugin.key}
                className={`rounded-lg border p-5 transition-colors ${
                  enabled
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{plugin.icon}</span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => handleToggle(plugin, checked)}
                    disabled={isToggling}
                  />
                </div>
                <h4 className="font-display font-semibold text-foreground">{plugin.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{plugin.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{plugin.category}</Badge>
                  {enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Coming Soon</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map(plugin => (
            <div key={plugin.key} className="rounded-lg border border-border bg-card p-5 opacity-60">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{plugin.icon}</span>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <h4 className="font-display font-semibold text-foreground">{plugin.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{plugin.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{plugin.category}</Badge>
                <Circle className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPlugins;
