import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Download, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useProducts, toLegacyProduct } from '@/hooks/useProducts';
import heroBg from '@/assets/hero-bg.jpg';

const features = [
  { icon: ShieldCheck, title: 'Halal Certified', desc: 'Every product is verified and certified halal' },
  { icon: Truck, title: 'Pakistan-wide Delivery', desc: 'Delivering across Pakistan with care' },
  { icon: Download, title: 'Instant Downloads', desc: 'Digital products delivered after approval' },
  { icon: Heart, title: 'Zakat Donations', desc: 'Option to add Zakat at checkout' },
];

const Index = () => {
  const { products, loading } = useProducts();
  const featured = products.slice(0, 6).map(toLegacyProduct);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <p className="font-arabic text-lg text-gold-light mb-2">بسم الله الرحمن الرحيم</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">
              Knowledge with{' '}
              <span className="text-gold-gradient">Barakah</span>
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-lg">
              Discover premium Islamic books, courses, and ethically sourced products — all rooted in authentic Islamic values.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gold-gradient border-0 text-foreground font-semibold">
                <Link to="/shop">Shop Collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/shop?type=digital">Digital Products</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border bg-card geometric-pattern">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">Curated Selection</p>
            <h2 className="font-display text-3xl font-bold text-foreground">Featured Products</h2>
          </div>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="emerald-gradient geometric-pattern-dense">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Read with <span className="text-gold-gradient">Purpose</span>
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md mx-auto">
            Every purchase supports ethical sourcing and Islamic knowledge. Add Zakat at checkout to amplify your impact.
          </p>
          <Button asChild size="lg" className="mt-6 gold-gradient border-0 text-foreground font-semibold">
            <Link to="/shop">Explore Collection</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
