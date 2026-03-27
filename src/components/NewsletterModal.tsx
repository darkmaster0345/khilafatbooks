import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Mail, X, Sparkles } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import { motion, AnimatePresence } from 'framer-motion';

const NewsletterModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenNewsletter');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('hasSeenNewsletter', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl">
        <div className="relative">
          {/* Header Image/Background */}
          <div className="h-32 bg-primary relative overflow-hidden">
            <div className="absolute inset-0 geometric-pattern-dense opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-background/20 backdrop-blur-md p-4 rounded-2xl border border-white/20"
              >
                <Mail className="h-8 w-8 text-white" />
              </motion.div>
            </div>
          </div>

          <div className="p-8 text-center space-y-4">
            <div className="space-y-2">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold text-foreground">
                  Join the <span className="text-primary">Khilafat</span> Circle
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                  Get weekly Islamic wisdom, new book alerts, and exclusive community discounts delivered to your inbox.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="pt-2">
              <NewsletterSignup variant="cta" />
            </div>

            <p className="text-[10px] text-muted-foreground">
              By subscribing, you agree to our Privacy Policy. No spam, just Barakah.
            </p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsletterModal;
