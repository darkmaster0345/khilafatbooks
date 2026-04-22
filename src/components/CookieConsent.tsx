import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has already made a choice
    const storedConsent = localStorage.getItem('cookie-consent');
    if (storedConsent === null) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setConsent(storedConsent === 'true');
    }
  }, []);

  useEffect(() => {
    // Load GA4 only after consent is given
    if (consent === true) {
      loadAnalytics();
    }
  }, [consent]);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setConsent(true);
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'false');
    setConsent(false);
    setShowBanner(false);
  };

  const loadAnalytics = () => {
    // GA4 will be loaded here if consent is given
    // The actual GA4 script should be conditionally loaded
    console.log('Analytics loading would happen here');
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-background border-t border-border shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">We value your privacy</p>
                <p className="text-muted-foreground">
                  We use cookies to enhance your browsing experience and analyze our traffic.
                  By clicking "Accept", you consent to our use of cookies.{' '}
                  <a href="/privacy-policy" className="underline hover:text-primary">
                    Learn more
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleDecline}>
                Decline
              </Button>
              <Button size="sm" onClick={handleAccept}>
                Accept
              </Button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-2 hover:bg-muted rounded-lg ml-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent');
    if (stored !== null) {
      setConsent(stored === 'true');
    }
  }, []);

  return consent;
}
