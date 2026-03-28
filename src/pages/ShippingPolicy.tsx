import { SEOHead } from '@/components/SEOHead';
import { Truck, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const ShippingPolicy = () => {
  return (
    <>
      <SEOHead title="Shipping Policy | Khilafat Books" description="Information about delivery times and shipping costs across Pakistan." canonical="/shipping-policy" />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16">
          <p className="section-heading">Delivery Information</p>
          <h1 className="section-title text-4xl">Shipping Policy</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-16">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <Truck className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">Delivery Coverage</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We deliver across all of Pakistan, including major cities and remote areas, using trusted courier partners.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <Clock className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">Estimated Times</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Karachi: 1-2 business days. Major Cities: 2-3 business days. Other areas: 4-5 business days.
            </p>
          </div>
        </div>

        <div className="prose prose-emerald dark:prose-invert max-w-none bg-card p-8 rounded-3xl border border-border">
          <h2 className="font-display">1. Shipping Charges</h2>
          <p>
            Standard shipping is a flat PKR 500 across Pakistan for orders below PKR 5,000.
            Orders above PKR 5,000 qualify for <strong>FREE Shipping</strong>.
          </p>

          <h2 className="font-display">2. Tracking Your Order</h2>
          <p>
            Once your order is shipped, you will receive a tracking number via SMS and email.
            You can also track your order status in the "My Orders" section of your account.
          </p>

          <h2 className="font-display">3. Verification Process</h2>
          <p>
            Orders are processed only after payment verification (for EasyPaisa/JazzCash).
            Please ensure you upload a clear screenshot of the transaction confirmation.
          </p>
        </div>
      </main>
    </>
  );
};

export default ShippingPolicy;
