import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => (
  <footer className="border-t border-border bg-card pb-20 md:pb-0">
    <div className="container mx-auto px-4">
      {/* Main footer */}
      <div className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Khilafat Books" className="h-9 w-9 rounded-xl shadow-sm object-contain" />
            <span className="font-display text-lg font-bold text-foreground">Khilafat Books</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Ethically sourced, halal-certified Islamic books and products for the modern Muslim lifestyle.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
            <li><Link to="/shop?type=physical" className="text-muted-foreground hover:text-primary transition-colors">Physical Products</Link></li>
            <li><Link to="/shop?type=digital" className="text-muted-foreground hover:text-primary transition-colors">Digital Products</Link></li>
            <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-4">Our Values</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Halal Certified</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Ethical Sourcing</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Fair Trade</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Zakat Contributions</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-4">Contact</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>support@khilafatbooks.com</li>
            <li>+92 345 2867726</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          © 2026 Khilafat Books — Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> for the Ummah
        </p>
        <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary transition-colors">Admin Login</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
