import { Helmet } from 'react-helmet-async';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <Helmet>
        <title>Shipping Policy | Khilafat Books</title>
        <meta name="description" content="Learn about our shipping rates and delivery times across Pakistan." />
      </Helmet>

      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">Shipping Policy</h1>
        <p className="text-muted-foreground">Fast and reliable delivery for the Ummah across Pakistan.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-16">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <Truck className="h-8 w-8 text-primary mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Delivery Areas</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We deliver to all major cities and towns across Pakistan, including Karachi, Lahore, Islamabad, Faisalabad, and more.
            For remote areas, delivery may take slightly longer.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <Clock className="h-8 w-8 text-primary mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Delivery Times</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Orders are typically processed within 24 hours. Standard delivery takes 2-5 working days.
            Digital products are delivered instantly via email after payment approval.
          </p>
        </div>
      </div>

      <div className="prose prose-emerald dark:prose-invert max-w-none">
        <h3 className="font-display text-2xl font-bold">Shipping Rates</h3>
        <p>
          We offer flat-rate shipping across Pakistan. Orders over **Rs. 5,000** qualify for **FREE shipping**.
          For orders below this amount, a standard shipping fee of Rs. 250 applies.
        </p>

        <h3 className="font-display text-2xl font-bold">Order Tracking</h3>
        <p>
          Once your order is shipped, you will receive a tracking number via SMS or Email.
          You can track your order status directly on our website or through our courier partner's portal.
        </p>

        <h3 className="font-display text-2xl font-bold">International Shipping</h3>
        <p>
          Currently, we only ship within Pakistan. For international inquiries, please contact our support team
          at support@khilafatbooks.com, and we will do our best to assist you.
        </p>
      </div>
    </main>
  );
};

export default ShippingPolicy;
