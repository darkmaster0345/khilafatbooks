import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, Settings, Shield, BarChart3, Megaphone, Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

// Cookie consent types
export interface ConsentCategories {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface ConsentData {
  version: string;
  timestamp: string;
  categories: ConsentCategories;
}

interface ConsentContextType {
  consent: ConsentData | null;
  showBanner: boolean;
  isLoading: boolean;
  categories: ConsentCategories;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  updateCategories: (categories: Partial<ConsentCategories>) => void;
  hasAnalyticsConsent: () => boolean;
  hasMarketingConsent: () => boolean;
  hasPreferencesConsent: () => boolean;
  reopenConsent: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

// Cookie Policy Version - increment when policy changes
export const COOKIE_POLICY_VERSION = '1.0';
const CONSENT_COOKIE_NAME = 'kb_cookie_consent';
const CONSENT_EXPIRY_DAYS = 365;

const defaultCategories: ConsentCategories = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: true,
};

// Google Analytics loading
const loadGoogleAnalytics = (gaId: string) => {
  if (!gaId || document.getElementById('ga-script')) return;

  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const inlineScript = document.createElement('script');
  inlineScript.id = 'ga-init-script';
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}', { send_page_view: false });
  `;
  document.head.appendChild(inlineScript);
};

// Contentsquare loading
const loadContentsquare = () => {
  if (document.getElementById('contentsquare-script')) return;

  const script = document.createElement('script');
  script.id = 'contentsquare-script';
  script.innerHTML = `
    (function(c,s,q,u,a,r,e){
      c['ContentsquareCommandQueue'] = c['ContentsquareCommandQueue'] || [];
      c['contentsquare'] = c['contentsquare'] || function() {
        c['ContentsquareCommandQueue'].push(arguments);
      };
      e = s.createElement(q);
      e.async = true;
      e.src = u + a;
      r = s.getElementsByTagName(q)[0];
      r.parentNode.insertBefore(e, r);
    })(window, document, 'script', 'https://t.contentsquare.net/', 'cs.js');
  `;
  document.head.appendChild(script);
};

// Remove tracking scripts
const removeTrackingScripts = () => {
  const gaScript = document.getElementById('ga-script');
  const gaInit = document.getElementById('ga-init-script');
  const csScript = document.getElementById('contentsquare-script');

  gaScript?.remove();
  gaInit?.remove();
  csScript?.remove();

  // Clear dataLayer
  if ((window as any).dataLayer) {
    (window as any).dataLayer = [];
  }
};

// Consent Provider
export function ConsentProvider({ children }: { children: ReactNode }) {
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
          const parsed: ConsentData = JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));
          
          // Check if policy version changed
          if (parsed.version !== COOKIE_POLICY_VERSION) {
            setShowBanner(true);
          } else {
            setConsent(parsed);
            setShowBanner(false);
          }
        } else {
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

  // Apply consent to load/remove scripts
  useEffect(() => {
    if (!consent) return;

    if (consent.categories.analytics) {
      const gaId = import.meta.env.VITE_GA_ID;
      if (gaId) loadGoogleAnalytics(gaId);
    } else {
      removeTrackingScripts();
    }

    if (consent.categories.marketing) {
      loadContentsquare();
    } else {
      const csScript = document.getElementById('contentsquare-script');
      csScript?.remove();
    }
  }, [consent]);

  // Save consent to cookie and Supabase
  const saveConsent = useCallback(async (categories: ConsentCategories) => {
    const consentData: ConsentData = {
      version: COOKIE_POLICY_VERSION,
      timestamp: new Date().toISOString(),
      categories,
    };

    // Save to cookie
    const expires = new Date();
    expires.setDate(expires.getDate() + CONSENT_EXPIRY_DAYS);
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consentData))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    setConsent(consentData);
    setShowBanner(false);

    // Save to Supabase if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            cookie_consent: consentData as any,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error saving consent to profile:', error);
    }

    return consentData;
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  }, [saveConsent]);

  const rejectNonEssential = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }, [saveConsent]);

  const updateCategories = useCallback((newCategories: Partial<ConsentCategories>) => {
    const merged = { ...defaultCategories, ...newCategories };
    saveConsent(merged);
  }, [saveConsent]);

  const hasAnalyticsConsent = useCallback(() => {
    return consent?.categories?.analytics === true;
  }, [consent]);

  const hasMarketingConsent = useCallback(() => {
    return consent?.categories?.marketing === true;
  }, [consent]);

  const hasPreferencesConsent = useCallback(() => {
    return consent?.categories?.preferences === true;
  }, [consent]);

  const reopenConsent = useCallback(() => {
    setShowBanner(true);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        showBanner,
        isLoading,
        categories: consent?.categories || defaultCategories,
        acceptAll,
        rejectNonEssential,
        updateCategories,
        hasAnalyticsConsent,
        hasMarketingConsent,
        hasPreferencesConsent,
        reopenConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

// Hook
export function useCookieConsent() {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a ConsentProvider');
  }
  return context;
}

// Cookie Consent Banner Component
export function CookieConsentBanner() {
  const { showBanner, isLoading, acceptAll, rejectNonEssential, categories, updateCategories } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [localCategories, setLocalCategories] = useState<ConsentCategories>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories, showSettings]);

  const handleCustomize = () => {
    setLocalCategories(categories);
    setShowSettings(true);
  };

  const handleSaveSettings = () => {
    updateCategories(localCategories);
    setShowSettings(false);
  };

  if (isLoading) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-2xl px-4"
          >
            <div className="bg-background border border-border shadow-2xl rounded-2xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                    <Cookie className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">We value your privacy</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      We use cookies to enhance your experience and analyze site traffic.{' '}
                      <a href="/cookie-policy" className="underline hover:text-primary">
                        Learn more
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                  <Button variant="outline" size="sm" onClick={rejectNonEssential} className="flex-1 md:flex-none text-xs">
                    Reject Non-Essential
                  </Button>
                  <Button size="sm" onClick={handleCustomize} variant="secondary" className="flex-1 md:flex-none text-xs">
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Customize
                  </Button>
                  <Button size="sm" onClick={acceptAll} className="flex-1 md:flex-none emerald-gradient text-xs">
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Customize your cookie preferences. Necessary cookies are always enabled for site functionality.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Necessary */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Necessary</p>
                  <p className="text-xs text-muted-foreground">
                    Essential for the site to function. Includes authentication, sessions, and cart.
                  </p>
                </div>
              </div>
              <Switch checked={true} disabled aria-readonly />
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Google Analytics and Contentsquare for understanding site usage.
                  </p>
                </div>
              </div>
              <Switch
                checked={localCategories.analytics}
                onCheckedChange={(checked) =>
                  setLocalCategories(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                  <Megaphone className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Marketing</p>
                  <p className="text-xs text-muted-foreground">
                    For future marketing and promotional content.
                  </p>
                </div>
              </div>
              <Switch
                checked={localCategories.marketing}
                onCheckedChange={(checked) =>
                  setLocalCategories(prev => ({ ...prev, marketing: checked }))
                }
              />
            </div>

            {/* Preferences */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
                  <Palette className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Preferences</p>
                  <p className="text-xs text-muted-foreground">
                    Remember your settings like theme and language preferences.
                  </p>
                </div>
              </div>
              <Switch
                checked={localCategories.preferences}
                onCheckedChange={(checked) =>
                  setLocalCategories(prev => ({ ...prev, preferences: checked }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="flex-1 emerald-gradient">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Legacy export for compatibility
export default function CookieConsent() {
  return <CookieConsentBanner />;
}

export { useAnalyticsConsent } from '@/hooks/useCookieConsent';
