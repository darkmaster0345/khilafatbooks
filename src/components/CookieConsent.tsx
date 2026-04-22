import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Cookie consent types
interface ConsentSettings {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

interface ConsentContextType {
  consent: ConsentSettings | null;
  hasConsented: boolean;
  updateConsent: (settings: ConsentSettings) => void;
  acceptAll: () => void;
  declineNonEssential: () => void;
  openSettings: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const CONSENT_COOKIE_NAME = 'kb_cookie_consent';
const CONSENT_EXPIRY_DAYS = 365;

// Load Google Analytics
const loadGoogleAnalytics = (gaId: string) => {
  if (!gaId || document.getElementById('ga-script')) return;

  // Load gtag script
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  // Initialize gtag
  const inlineScript = document.createElement('script');
  inlineScript.id = 'ga-init-script';
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}', { send_page_view: false });
  `;
  document.head.appendChild(inlineScript);

  console.log('[CookieConsent] Google Analytics loaded');
};

// Load Contentsquare
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

  console.log('[CookieConsent] Contentsquare loaded');
};

// Remove tracking scripts
const removeTrackingScripts = () => {
  const gaScript = document.getElementById('ga-script');
  const gaInitScript = document.getElementById('ga-init-script');
  const csScript = document.getElementById('contentsquare-script');

  gaScript?.remove();
  gaInitScript?.remove();
  csScript?.remove();

  // Clear any existing dataLayer to prevent data leakage
  if (window.dataLayer) {
    window.dataLayer = [];
  }

  console.log('[CookieConsent] Tracking scripts removed');
};

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentSettings | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load consent from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_COOKIE_NAME);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
      } catch {
        setShowBanner(true);
      }
    } else {
      // No consent yet, show banner
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Apply consent changes (load/remove scripts)
  useEffect(() => {
    if (!consent) return;

    if (consent.analytics) {
      const gaId = import.meta.env.VITE_GA_ID;
      if (gaId) loadGoogleAnalytics(gaId);
    } else {
      // If analytics declined, remove GA scripts
      const gaScript = document.getElementById('ga-script');
      const gaInit = document.getElementById('ga-init-script');
      gaScript?.remove();
      gaInit?.remove();
    }

    if (consent.marketing) {
      loadContentsquare();
    } else {
      // If marketing declined, remove Contentsquare
      const csScript = document.getElementById('contentsquare-script');
      csScript?.remove();
    }
  }, [consent]);

  const saveConsent = useCallback((settings: ConsentSettings) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + CONSENT_EXPIRY_DAYS);

    localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(settings));
    setConsent(settings);
    setShowBanner(false);
    setShowSettings(false);
  }, []);

  const updateConsent = useCallback((settings: ConsentSettings) => {
    saveConsent(settings);
  }, [saveConsent]);

  const acceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  }, [saveConsent]);

  const declineNonEssential = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  }, [saveConsent]);

  const openSettings = useCallback(() => {
    setShowSettings(true);
    setShowBanner(false);
  }, []);

  const value: ConsentContextType = {
    consent,
    hasConsented: consent !== null,
    updateConsent,
    acceptAll,
    declineNonEssential,
    openSettings,
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
      <CookieBanner
        show={showBanner}
        onAccept={acceptAll}
        onDecline={declineNonEssential}
        onSettings={() => setShowSettings(true)}
        onClose={() => setShowBanner(false)}
      />
      <ConsentSettingsModal
        show={showSettings}
        currentConsent={consent}
        onSave={updateConsent}
        onClose={() => {
          setShowSettings(false);
          if (!consent) setShowBanner(true);
        }}
      />
    </ConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}

// Banner Component
function CookieBanner({
  show,
  onAccept,
  onDecline,
  onSettings,
  onClose,
}: {
  show: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onSettings: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50 p-4 bg-background border border-border rounded-lg shadow-2xl"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">We value your privacy</p>
                <p className="text-muted-foreground text-xs mt-1">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.{' '}
                  <a href="/cookie-policy" className="underline hover:text-primary">
                    Learn more
                  </a>
                </p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={onAccept}>
                  Accept All
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={onDecline}>
                  Reject Non-Essential
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={onSettings} className="gap-2">
                <Settings className="h-4 w-4" />
                Customize
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Settings Modal Component
function ConsentSettingsModal({
  show,
  currentConsent,
  onSave,
  onClose,
}: {
  show: boolean;
  currentConsent: ConsentSettings | null;
  onSave: (settings: ConsentSettings) => void;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<ConsentSettings>({
    necessary: true,
    analytics: currentConsent?.analytics ?? false,
    marketing: currentConsent?.marketing ?? false,
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Cookie Preferences</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Manage your cookie preferences. Necessary cookies are always enabled as they are required for the website to function properly.
        </p>

        <div className="space-y-4 mb-6">
          {/* Necessary - Always enabled */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Necessary</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Required</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Essential cookies for the website to function properly. These cannot be disabled.
              </p>
            </div>
            <input
              type="checkbox"
              checked={true}
              disabled
              className="h-4 w-4 mt-1"
            />
          </div>

          {/* Analytics */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <span className="font-medium">Analytics</span>
              <p className="text-xs text-muted-foreground mt-1">
                Help us understand how visitors interact with our website by collecting anonymous data.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.analytics}
              onChange={(e) => setSettings(s => ({ ...s, analytics: e.target.checked }))}
              className="h-4 w-4 mt-1 cursor-pointer"
            />
          </div>

          {/* Marketing */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <span className="font-medium">Marketing</span>
              <p className="text-xs text-muted-foreground mt-1">
                Used to deliver personalized advertisements and measure their effectiveness.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.marketing}
              onChange={(e) => setSettings(s => ({ ...s, marketing: e.target.checked }))}
              className="h-4 w-4 mt-1 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => onSave(settings)}>
            Save Preferences
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Legacy export for compatibility
export default function CookieConsent() {
  return null; // Actual component is now part of the provider
}
