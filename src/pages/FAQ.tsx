import { Helmet } from 'react-helmet-async';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const faqs = [
  {
    q: 'How do I place an order?',
    a: 'Browse our shop, add items to your cart, and proceed to checkout. Pay via EasyPaisa/JazzCash and upload your payment screenshot. We verify and ship within 24-48 hours.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept EasyPaisa, JazzCash, and bank transfers. Cash on delivery is available for select cities. All transactions are verified manually for security.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery within Pakistan takes 3-5 business days. Major cities (Lahore, Karachi, Islamabad) typically receive orders within 2-3 days.',
  },
  {
    q: 'Do you offer free shipping?',
    a: 'Yes! Orders above Rs. 5,000 qualify for free shipping across Pakistan. Orders below this amount have a flat Rs. 500 shipping fee.',
  },
  {
    q: 'Are your products Halal certified?',
    a: 'Products marked with the Halal badge have been verified through our sourcing process. We partner with ethical and halal-certified suppliers for fragrances, food items, and prayer essentials.',
  },
  {
    q: 'How do digital products work?',
    a: 'After your order is confirmed, digital products (PDFs, courses) appear instantly in your "My Library" section. You can download them anytime from your account.',
  },
  {
    q: 'Can I return or exchange a product?',
    a: 'Physical products can be returned within 7 days if unopened and in original condition. Digital products are non-refundable once delivered. Contact us via WhatsApp for returns.',
  },
  {
    q: 'What is the loyalty program?',
    a: 'We have three tiers: Talib (0-1,999 PKR spent), Muallim (2,000-9,999 PKR), and Alim (10,000+ PKR). Higher tiers unlock referral codes, exclusive discounts, and digital rewards.',
  },
  {
    q: 'How does the referral program work?',
    a: 'Muallim and Alim tier members can generate a referral code. Share it with friends — they get 5% off their first order (min Rs. 800), and you earn an 8% discount code when their order is delivered.',
  },
  {
    q: 'How can I request a book you don\'t carry?',
    a: 'Visit our "Request a Book" page and submit a suggestion. If enough community members pledge interest, we\'ll source and add it to our catalog!',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
    },
  })),
};

const FAQ = () => {
  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <Helmet>
        {/* Optimized title and description for Islamic books support */}
        <title>FAQ — Islamic Bookstore Support | Khilafat Books</title>
        <meta name="description" content="Find answers to common questions about ordering Islamic books, shipping rates in Pakistan, EasyPaisa payments, and our Zakat donation flow at Khilafat Books." />
        <link rel="canonical" href="https://khilafatbooks.vercel.app/faq" />
        <link rel="alternate" hreflang="en" href="https://khilafatbooks.vercel.app/faq" />
        <link rel="alternate" hreflang="ur" href="https://khilafatbooks.vercel.app/faq" />

        {/* OG tags with optimized Cloudinary image for FAQ page */}
        <meta property="og:title" content="FAQ — Islamic Bookstore Support | Khilafat Books" />
        <meta property="og:description" content="Find answers to common questions about ordering Islamic books, shipping rates in Pakistan, and EasyPaisa payments." />
        <meta property="og:url" content="https://khilafatbooks.vercel.app/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://res.cloudinary.com/dlnv8866e/image/upload/f_auto,q_auto,w_1200,h_630,c_fill/v1710500000/faq-banner.jpg" />

        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="section-heading">Support</p>
        <h1 className="section-title">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Can't find your answer? Reach out via WhatsApp and we'll help you out.
        </p>

        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </main>
  );
};

export default FAQ;
