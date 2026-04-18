import { ShieldCheck, Truck, CreditCard, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

const badges = [
  { icon: ShieldCheck, label: 'Halal Certified', sub: '100% Verified' },
  { icon: Truck, label: '1000+ Orders', sub: 'Delivered Nationwide' },
  { icon: CreditCard, label: 'Secure Payments', sub: 'EasyPaisa & Bank' },
  { icon: Headphones, label: '24hr Support', sub: 'WhatsApp & Chat' },
];

const TrustBadges = () => (
  <section className="border-b border-border bg-background">
    <div className="container mx-auto px-4 py-4 sm:py-5">
      <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-8 md:gap-16">
        {badges.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex items-center gap-2.5 sm:gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8">
              <b.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight">{b.label}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">{b.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadges;
