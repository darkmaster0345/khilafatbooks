import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;

export interface GeneralSettings {
  easypaisa_account: string;
  easypaisa_name: string;
  free_shipping_threshold: string;
  shipping_fee: string;
  whatsapp_number: string;
  store_email: string;
  order_prefix: string;
  zakat_enabled: boolean;
  zakat_rate: string;
  maintenance_mode: boolean;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  easypaisa_account: '03352706540',
  easypaisa_name: 'Khilafat Books',
  free_shipping_threshold: '5000',
  shipping_fee: '500',
  whatsapp_number: '923352706540',
  store_email: 'support@khilafatbooks.com',
  order_prefix: 'KB',
  zakat_enabled: true,
  zakat_rate: '2.5',
  maintenance_mode: false,
};

export const useGeneralSettings = () => {
  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['general-settings'],
    queryFn: async () => {
      const { data, error } = await db
        .from('store_settings')
        .select('value')
        .eq('key', 'general')
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...(data.value as any) };
    },
    staleTime: 60_000,
  });

  return { settings, isLoading };
};
