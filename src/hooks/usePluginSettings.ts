import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PluginName =
  | 'whatsapp_notifications'
  | 'easypaisa_payments'
  | 'zakat_calculator'
  | 'ai_chat'
  | 'email_notifications'
  | 'sms_alerts'
  | 'jazzcash_payments'
  | 'inventory_tracking'
  | 'seo_tools';

const DEFAULT_PLUGINS: Record<PluginName, boolean> = {
  whatsapp_notifications: true,
  easypaisa_payments: true,
  zakat_calculator: true,
  ai_chat: true,
  email_notifications: false,
  sms_alerts: false,
  jazzcash_payments: false,
  inventory_tracking: false,
  seo_tools: false,
};

export const usePluginSettings = () => {
  const queryClient = useQueryClient();

  const { data: plugins = DEFAULT_PLUGINS, isLoading } = useQuery({
    queryKey: ['plugin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'plugins')
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_PLUGINS;
      return { ...DEFAULT_PLUGINS, ...(data.value as Record<string, boolean>) };
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ name, enabled }: { name: PluginName; enabled: boolean }) => {
      const updated = { ...plugins, [name]: enabled };
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key: 'plugins', value: updated as any }, { onConflict: 'key' });
      if (error) throw error;
      return updated;
    },
    onMutate: async ({ name, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['plugin-settings'] });
      const prev = queryClient.getQueryData(['plugin-settings']);
      queryClient.setQueryData(['plugin-settings'], (old: any) => ({ ...old, [name]: enabled }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['plugin-settings'], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plugin-settings'] });
    },
  });

  const isPluginEnabled = (name: PluginName) => plugins[name] ?? false;
  const togglePlugin = (name: PluginName, enabled: boolean) => toggleMutation.mutate({ name, enabled });

  return { plugins, isLoading, isPluginEnabled, togglePlugin, isToggling: toggleMutation.isPending };
};
