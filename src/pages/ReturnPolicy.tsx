import { Helmet } from 'react-helmet-async';
import { RefreshCcw, ShieldCheck, AlertCircle } from 'lucide-react';

const ReturnPolicy = () => {
  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <Helmet>
        <title>Return & Refund Policy | Khilafat Books</title>
        <meta name="description" content="Read about our 7-day return policy and how to request a refund." />
      </Helmet>

      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">Return & Refund Policy</h1>
        <p className="text-muted-foreground">Your satisfaction is our priority. Shop with peace of mind.</p>
      </div>

      <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 mb-12 flex flex-col items-center text-center">
        <RefreshCcw className="h-12 w-12 text-primary mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">7-Day Easy Returns</h2>
        <p className="text-muted-foreground max-w-lg">
          If you're not satisfied with your physical purchase, you can return it within 7 days of delivery
          for an exchange or a full refund.
        </p>
      </div>

      <div className="prose prose-emerald dark:prose-invert max-w-none">
        <h3 className="font-display text-2xl font-bold">Conditions for Returns</h3>
        <ul>
          <li>The item must be in its original packaging.</li>
          <li>The item must be unused and in the same condition that you received it.</li>
          <li>Proof of purchase (invoice) must be provided.</li>
        </ul>

        <h3 className="font-display text-2xl font-bold">Non-Returnable Items</h3>
        <p>Certain types of items cannot be returned:</p>
        <ul>
          <li>**Digital Products:** Due to the nature of digital downloads, courses and E-books are non-refundable once accessed.</li>
          <li>**Personal Care Items:** Opened fragrances or oils cannot be returned for hygiene reasons.</li>
        </ul>

        <h3 className="font-display text-2xl font-bold">Refund Process</h3>
        <p>
          Once we receive and inspect your return, we will notify you of the approval or rejection of your refund.
          If approved, your refund will be processed via EasyPaisa or Bank Transfer within 3-5 working days.
        </p>

        <div className="bg-muted p-6 rounded-2xl flex gap-4 items-start mt-8">
          <AlertCircle className="h-6 w-6 text-accent shrink-0 mt-1" />
          <div>
            <h4 className="font-bold mb-1">Damaged Items</h4>
            <p className="text-sm text-muted-foreground m-0">
              If you receive a damaged book or product, please contact us immediately at +92 345 2867726 with
              photos of the damage. We will send a replacement at no extra cost.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ReturnPolicy;
