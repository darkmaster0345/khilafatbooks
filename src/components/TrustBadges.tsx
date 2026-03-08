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
    <div className="container mx-auto px-4 py-5">
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
        {badges.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <b.icon className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">{b.label}</p>
              <p className="text-[10px] text-muted-foreground">{b.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadges;
