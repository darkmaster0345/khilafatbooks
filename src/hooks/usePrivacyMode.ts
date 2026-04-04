import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useAuth } from '@/hooks/useAuth';

export function usePrivacyMode() {
  const { user } = useAuth();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [privacyPaid, setPrivacyPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    db
      .from('profiles')
      .select('privacy_mode, privacy_paid')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPrivacyMode(!!(data as any).privacy_mode);
          setPrivacyPaid(!!(data as any).privacy_paid);
        }
        setLoading(false);
      });
  }, [user]);

  const activatePrivacy = useCallback(async () => {
    if (!user) return false;
    const { error } = await db
      .from('profiles')
      .update({ privacy_mode: true, privacy_paid: true } as any)
      .eq('user_id', user.id);
    if (!error) {
      setPrivacyMode(true);
      setPrivacyPaid(true);
      return true;
    }
    return false;
  }, [user]);

  const deactivatePrivacy = useCallback(async () => {
    if (!user) return false;
    const { error } = await db
      .from('profiles')
      .update({ privacy_mode: false } as any)
      .eq('user_id', user.id);
    if (!error) {
      setPrivacyMode(false);
      return true;
    }
    return false;
  }, [user]);

  return { privacyMode, privacyPaid, loading, activatePrivacy, deactivatePrivacy };
}
