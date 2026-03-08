import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Ahmed R.',
    location: 'Lahore',
    text: 'Excellent quality Quran with beautiful calligraphy. Packaging was amazing and arrived within 2 days!',
    rating: 5,
    initials: 'AR',
  },
  {
    name: 'Fatima K.',
    location: 'Karachi',
    text: 'The digital courses are incredibly well-structured. I learned Tajweed basics in just a week. Highly recommend!',
    rating: 5,
    initials: 'FK',
  },
  {
    name: 'Usman S.',
    location: 'Islamabad',
    text: 'Best Islamic bookstore in Pakistan. The oud fragrance is authentic and long-lasting. Will order again InshaAllah.',
    rating: 5,
    initials: 'US',
  },
  {
    name: 'Aisha M.',
    location: 'Rawalpindi',
    text: 'Love the Zakat donation option at checkout. It makes me feel good about every purchase. JazakAllah Khair!',
    rating: 4,
    initials: 'AM',
  },
];

const Testimonials = () => (
  <section className="bg-card/50 border-y border-border">
    <div className="container mx-auto px-4 py-20">
      <div className="mb-12 text-center">
        <p className="section-heading">What Our Customers Say</p>
        <h2 className="section-title text-balance">Trusted by the Ummah</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="relative rounded-2xl border border-border bg-background p-6 hover-lift group"
          >
            {/* Decorative quote */}
            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/8 group-hover:text-primary/15 transition-colors" />

            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-4">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={`h-3.5 w-3.5 ${j < t.rating ? 'fill-accent text-accent' : 'text-muted'}`} />
              ))}
            </div>

            {/* Quote text */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-4">"{t.text}"</p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/60">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
