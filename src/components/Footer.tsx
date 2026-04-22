import { Link } from 'react-router-dom';
import { Heart, Facebook, Instagram, Twitter, MapPin, Phone, Mail, CreditCard, ShieldCheck, BadgeCheck, Lock, ExternalLink } from 'lucide-react';
import logo from '@/assets/logo.png';
import NewsletterSignup from '@/components/NewsletterSignup';

const Footer = () => (
  <footer className="border-t border-border bg-card pb-20 md:pb-0">
    <div className="container mx-auto px-4">
      {/* Trust Badges */}
      <div className="py-8 border-b border-border">
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">SSL Secured</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BadgeCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">100% Authentic Islamic Books</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium">PECA Compliant</span>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand Column */}
        <div className="md:col-span-1 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Khilafat Books logo — Islamic Bookstore Pakistan" className="h-9 w-9 rounded-xl shadow-sm object-contain" />
            <span className="font-display text-lg font-bold text-foreground">Khilafat Books</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
            Ethically sourced, halal-certified Islamic books and products for the modern Muslim lifestyle.
          </p>
          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Stay Updated</h3>
            <NewsletterSignup variant="footer" />
          </div>
        </div>

        {/* Shop Column */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-4">Shop</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">All Books</Link></li>
            <li><Link to="/shop?sort=newest" className="text-muted-foreground hover:text-primary transition-colors">New Arrivals</Link></li>
            <li><Link to="/shop?sort=bestselling" className="text-muted-foreground hover:text-primary transition-colors">Best Sellers</Link></li>
            <li><Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">Categories</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-4">Company</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
          </ul>
        </div>

        {/* Support Column */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-4">Support</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
            <li><Link to="/shipping-policy" className="text-muted-foreground hover:text-primary transition-colors">Shipping</Link></li>
            <li><Link to="/orders" className="text-muted-foreground hover:text-primary transition-colors">Track Order</Link></li>
            <li><Link to="/return-policy" className="text-muted-foreground hover:text-primary transition-colors">Returns</Link></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-4">Contact Us</h2>
          <ul className="space-y-3 text-sm text-muted-foreground mb-6">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Main Rashid Minhas Road, Karachi, Sindh, 74800, Pakistan</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>+92 345 2867726</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>ubaid0345@proton.me</span>
            </li>
          </ul>
          <div className="flex gap-3">
            <a href="https://facebook.com/KhilafatBooks" target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://instagram.com/KhilafatBooks" target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://twitter.com/KhilafatBooks" target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="border-t border-border py-4">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/cookie-policy" className="hover:text-primary transition-colors">Cookie Policy</Link>
          <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
          <Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>
          <Link to="/security" className="hover:text-primary transition-colors">Security</Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          © {new Date().getFullYear()} Khilafat Books — Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> for the Ummah
        </p>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-semibold">Admin Login</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
