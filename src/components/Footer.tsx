import { Link } from 'react-router-dom';
import { Heart, Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';
import logo from '@/assets/logo.png';
import NewsletterSignup from '@/components/NewsletterSignup';

const Footer = () => (
  <footer className="border-t border-border bg-card pb-20 md:pb-0">
    <div className="container mx-auto px-4">
      {/* Main footer */}
      <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Khilafat Books" className="h-9 w-9 rounded-xl shadow-sm object-contain" />
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
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-4">Shop</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
            <li><Link to="/shop?type=physical" className="text-muted-foreground hover:text-primary transition-colors">Physical Products</Link></li>
            <li><Link to="/shop?type=digital" className="text-muted-foreground hover:text-primary transition-colors">Digital Products</Link></li>
            <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-4">Customer Care</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shipping-policy" className="text-muted-foreground hover:text-primary transition-colors">Shipping Policy</Link></li>
            <li><Link to="/return-policy" className="text-muted-foreground hover:text-primary transition-colors">Return & Refund Policy</Link></li>
            <li><Link to="/book-requests" className="text-muted-foreground hover:text-primary transition-colors">Request a Book</Link></li>
            <li><Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">My Account</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-4">Our Values</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Halal Certified</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Ethical Sourcing</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Fair Trade</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Zakat Contributions</li>
          </ul>
        </div>
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
              <span>support@khilafatbooks.com</span>
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
