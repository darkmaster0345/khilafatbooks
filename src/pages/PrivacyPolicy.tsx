import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy | Khilafat Books"
        description="Learn how Khilafat Books collects, uses, and protects your personal information in accordance with Islamic ethics and data protection standards."
        canonical="/privacy-policy"
      />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy", href: "/privacy-policy" }]} />

        <div className="mt-8 prose prose-slate max-w-none">
          <h1 className="font-display text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8 italic">Last Updated: October 2023</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p>
              At Khilafat Books, we are committed to protecting your privacy and ensuring that your personal
              information is handled in a safe and responsible manner. As an Islamic bookstore, we hold
              ourselves to the highest ethical standards (Amanah) in managing the data you entrust to us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us when you:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Create an account or update your profile</li>
              <li>Place an order for physical or digital products</li>
              <li>Sign up for our newsletter</li>
              <li>Contact our customer support team</li>
              <li>Participate in surveys or promotions</li>
            </ul>
            <p>This information may include your name, email address, phone number, shipping address, and payment proof (for EasyPaisa/Manual payments).</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and account</li>
              <li>Send you marketing communications (if you have opted in)</li>
              <li>Improve our website and customer service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p>
              We implement a variety of security measures to maintain the safety of your personal information.
              Your personal information is contained behind secured networks and is only accessible by a
              limited number of persons who have special access rights to such systems and are required to
              keep the information confidential.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Third-Party Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside
              parties except for trusted third parties who assist us in operating our website, conducting our
              business, or servicing you, so long as those parties agree to keep this information confidential.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information at any time. You can
              manage your account settings through the "My Account" section or contact us directly at
              support@khilafatbooks.com for assistance.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
            <p>
              If there are any questions regarding this privacy policy, you may contact us using the
              information below:
            </p>
            <p className="mt-4">
              <strong>Khilafat Books</strong><br />
              Main Rashid Minhas Road, Karachi, Pakistan<br />
              Email: support@khilafatbooks.com<br />
              WhatsApp: +92 345 2867726
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
