import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="geometric-pattern border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full emerald-gradient">
              <span className="font-arabic text-sm text-primary-foreground">بِ</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Barakah</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ethically sourced, halal-certified products for the modern Muslim lifestyle.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary transition-colors">All Products</Link></li>
            <li><Link to="/shop?type=physical" className="hover:text-primary transition-colors">Physical Products</Link></li>
            <li><Link to="/shop?type=digital" className="hover:text-primary transition-colors">Digital Products</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">Values</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Halal Certified</li>
            <li>Ethical Sourcing</li>
            <li>Fair Trade</li>
            <li>Zakat Contributions</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>support@barakah.store</li>
            <li>+1 (555) 123-4567</li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        <p>© 2026 Barakah — Ethical Commerce. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
