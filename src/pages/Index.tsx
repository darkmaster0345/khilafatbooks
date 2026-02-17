import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Download, Heart, Star, BookOpen } from 'lucide-react';
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
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/55 to-foreground/30" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-arabic text-xl text-gold-light/90 mb-4"
            >
              بسم الله الرحمن الرحيم
            </motion.p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground leading-[1.1]">
              Knowledge with{' '}
              <span className="text-gold-gradient">Barakah</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/75 max-w-lg leading-relaxed">
              Discover premium Islamic books, courses, and ethically sourced products — all rooted in authentic Islamic values.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gold-gradient border-0 text-foreground font-semibold h-12 px-8 text-base shadow-lg hover:shadow-xl transition-shadow">
                <Link to="/shop">Shop Collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8 text-base backdrop-blur-sm">
                <Link to="/shop?type=digital">
                  <Download className="mr-2 h-4 w-4" /> Digital Products
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex items-center gap-6 text-primary-foreground/50">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-xs text-primary-foreground/60">Trusted by 1000+ customers</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 mb-4 transition-colors group-hover:bg-primary/15">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[180px]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="section-heading">Curated Selection</p>
            <h2 className="section-title">Featured Products</h2>
          </div>
          <Link to="/shop" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 bg-muted rounded" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 emerald-gradient" />
        <div className="absolute inset-0 geometric-pattern-dense opacity-50" />
        <div className="relative container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <BookOpen className="h-10 w-10 text-gold-light mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Read with <span className="text-gold-gradient">Purpose</span>
            </h2>
            <p className="mt-4 text-primary-foreground/70 max-w-md mx-auto leading-relaxed">
              Every purchase supports ethical sourcing and Islamic knowledge. Add Zakat at checkout to amplify your impact.
            </p>
            <Button asChild size="lg" className="mt-8 gold-gradient border-0 text-foreground font-semibold h-12 px-8 text-base shadow-lg">
              <Link to="/shop">Explore Collection</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Index;
