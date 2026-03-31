import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';

const TermsOfService = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service | Khilafat Books"
        description="Read the terms and conditions for using Khilafat Books website and purchasing our Islamic products."
        canonical="/terms-of-service"
      />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Terms of Service", href: "/terms-of-service" }]} />

        <div className="mt-8 prose prose-slate max-w-none">
          <h1 className="font-display text-4xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8 italic">Last Updated: October 2023</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Khilafat Books website, you agree to comply with and be bound by
              these Terms of Service. If you do not agree to these terms, please do not use our website.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Ethical Conduct</h2>
            <p>
              Users are expected to interact with our platform in a manner consistent with Islamic values.
              This includes providing truthful information during registration and checkout, and
              respecting intellectual property rights.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. Product Information & Pricing</h2>
            <p>
              We strive to ensure that all product descriptions and prices are accurate. However, errors
              may occur. In the event of a pricing error, we reserve the right to cancel any orders placed
              at the incorrect price. Prices are subject to change without notice.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Digital Products</h2>
            <p>
              Digital products (PDFs, courses, etc.) are for personal use only. Sharing, distributing,
              or reselling our digital content is strictly prohibited and constitutes a breach of
              Amanah and copyright law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Payment & Order Fulfillment</h2>
            <p>
              Orders are processed once payment is verified. For manual payments (EasyPaisa), users
              must upload a valid proof of payment. We reserve the right to decline any order that
              cannot be verified or that violates our policies.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
            <p>
              Khilafat Books shall not be liable for any indirect, incidental, or consequential damages
              arising out of the use or inability to use our website or products.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">7. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes
              shall be resolved through mutual consultation (Shura) whenever possible, or through the
              appropriate legal channels in Karachi.
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default TermsOfService;
