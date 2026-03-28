import { SEOHead } from '@/components/SEOHead';
import { ShieldAlert, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ReturnPolicy = () => {
  return (
    <>
      <SEOHead title="Return & Refund Policy | Khilafat Books" description="Our policies for returns, exchanges, and refunds." canonical="/return-policy" />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16">
          <p className="section-heading">Customer Satisfaction</p>
          <h1 className="section-title text-4xl">Return & Refund Policy</h1>
        </div>

        <div className="prose prose-emerald dark:prose-invert max-w-none bg-card p-8 rounded-3xl border border-border">
          <h2 className="font-display">1. Returns Eligibility</h2>
          <p>
            Physical products can be returned within 7 days of delivery if they are in their original condition,
            unopened, and with all original tags/packaging intact.
          </p>

          <h2 className="font-display">2. Non-Returnable Items</h2>
          <p>
            The following items cannot be returned:
          </p>
          <ul>
            <li>Digital Products (PDFs, Online Courses) once access is provided.</li>
            <li>Fragrances (Oud/Attar) if the seal is broken.</li>
            <li>Personalized or custom items.</li>
          </ul>

          <h2 className="font-display">3. Refund Process</h2>
          <p>
            Once we receive and inspect the returned item, we will process your refund.
            Refunds are typically issued to your original payment method (EasyPaisa/JazzCash/Bank Account)
            within 3-5 business days.
          </p>

          <h2 className="font-display">4. Damaged or Wrong Items</h2>
          <p>
            If you receive a damaged or incorrect item, please contact us on WhatsApp (+92 345 2867726)
            within 24 hours with photos of the product. We will arrange a free replacement.
          </p>
        </div>
      </main>
    </>
  );
};

export default ReturnPolicy;
