import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Cookie Policy Version - increment this when policy changes to re-show banner
export const COOKIE_POLICY_VERSION = '1.0';
export const CONSENT_COOKIE_NAME = 'kb_cookie_consent';

export interface ConsentCategories {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface ConsentData {
  version: string;
  timestamp: string;
  categories: ConsentCategories;
}

const defaultConsent: ConsentCategories = {
  necessary: true, // Always required
  analytics: false, // Default OFF
  marketing: false, // Default OFF
  preferences: true, // Default ON
};

export function useCookieConsent() {
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from cookie
  useEffect(() => {
    const loadConsent = () => {
      try {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

        if (cookieValue) {
          const parsed = JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));
          
          // Check if policy version changed
          if (parsed.version !== COOKIE_POLICY_VERSION) {
            setShowBanner(true);
          } else {
            setConsent(parsed);
            setShowBanner(false);
          }
        } else {
          // No consent found - show banner after delay
          const timer = setTimeout(() => setShowBanner(true), 2000);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error parsing consent cookie:', error);
        setShowBanner(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  // Save consent to cookie and optionally to Supabase
  const saveConsent = useCallback(async (categories: ConsentCategories) => {
    const consentData: ConsentData = {
      version: COOKIE_POLICY_VERSION,
      timestamp: new Date().toISOString(),
      categories,
    };

    // Save to cookie (365 days)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consentData))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    setConsent(consentData);
    setShowBanner(false);

    // If user is logged in, also save to Supabase profile
    if (user?.id) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase
          .from('profiles')
          .update({
            cookie_consent: consentData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving consent to profile:', error);
      }
    }

    return consentData;
  }, [user]);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    return saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  }, [saveConsent]);

  // Reject non-essential cookies
  const rejectNonEssential = useCallback(() => {
    return saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }, [saveConsent]);

  // Update specific categories
  const updateCategories = useCallback((categories: Partial<ConsentCategories>) => {
    const newCategories = { ...defaultConsent, ...categories };
    return saveConsent(newCategories);
  }, [saveConsent]);

  // Check if analytics is allowed
  const hasAnalyticsConsent = useCallback(() => {
    return consent?.categories?.analytics === true;
  }, [consent]);

  // Check if marketing is allowed
  const hasMarketingConsent = useCallback(() => {
    return consent?.categories?.marketing === true;
  }, [consent]);

  // Check if preferences is allowed
  const hasPreferencesConsent = useCallback(() => {
    return consent?.categories?.preferences === true;
  }, [consent]);

  // Re-open consent banner
  const reopenConsent = useCallback(() => {
    setShowBanner(true);
  }, []);

  return {
    consent,
    showBanner,
    isLoading,
    categories: consent?.categories || defaultConsent,
    acceptAll,
    rejectNonEssential,
    updateCategories,
    hasAnalyticsConsent,
    hasMarketingConsent,
    hasPreferencesConsent,
    reopenConsent,
    saveConsent,
  };
}

// Hook specifically for checking analytics consent
export function useAnalyticsConsent() {
  const { hasAnalyticsConsent } = useCookieConsent();
  return hasAnalyticsConsent();
}
