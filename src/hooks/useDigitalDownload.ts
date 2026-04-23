import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useDigitalDownload() {
  const download = useCallback(async (productId: string, productName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-digital-product', {
        body: { productId },
      });

      if (error || !data?.url) {
        throw error ?? new Error('Missing download URL');
      }

      window.open(data.url, '_blank', 'noopener,noreferrer');
      toast.success(`Opening ${productName}`);
    } catch {
      toast.error('Failed to get download link');
    }
  }, []);

  return { download };
}
