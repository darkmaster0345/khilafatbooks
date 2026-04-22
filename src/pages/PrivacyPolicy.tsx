import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Shield, Database, Users, Clock, Download, Trash2 } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy | Khilafat Books"
        description="Learn how Khilafat Books collects, uses, and protects your personal information in accordance with Islamic ethics and data protection standards."
      />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy", href: "/privacy-policy" }]} />

        <div className="mt-8 prose prose-slate max-w-none">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">Your data, your rights, our commitment</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-8 italic">Last Updated: April 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p>
              At Khilafat Books, we are committed to protecting your privacy and ensuring that your personal
              information is handled in a safe and responsible manner. As an Islamic bookstore, we hold
              ourselves to the highest ethical standards (Amanah) in managing the data you entrust to us.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              2. Information We Collect
            </h2>
            <p className="mb-4">We collect the following types of information:</p>
            
            <h4 className="font-semibold mt-4 mb-2">Personal Information (you provide)</h4>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Name:</strong> For order fulfillment and account identification</li>
              <li><strong>Email address:</strong> For account access, order confirmations, and communications</li>
              <li><strong>Phone number:</strong> For delivery coordination and order updates</li>
              <li><strong>Shipping address:</strong> For physical product delivery</li>
              <li><strong>Billing address:</strong> For payment processing and invoicing</li>
              <li><strong>Payment proof:</strong> Screenshots/transaction IDs for manual payments (EasyPaisa, JazzCash, Bank Transfer)</li>
            </ul>

            <h4 className="font-semibold mt-4 mb-2">Automatically Collected Information</h4>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>IP address:</strong> For security and fraud prevention</li>
              <li><strong>Browser type and version:</strong> For website optimization</li>
              <li><strong>Device information:</strong> For improving mobile experience</li>
              <li><strong>Cookies and usage data:</strong> See our <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a></li>
              <li><strong>Browsing history:</strong> Pages visited, products viewed (with your consent)</li>
            </ul>

            <h4 className="font-semibold mt-4 mb-2">Order Information</h4>
            <ul className="list-disc pl-6 mb-4">
              <li>Purchase history and order details</li>
              <li>Product preferences and wishlist items</li>
              <li>Review and rating history</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. How We Collect Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Direct input:</strong> When you create an account, place an order, or fill out forms</li>
              <li><strong>Automated technologies:</strong> Cookies, web beacons, and similar technologies</li>
              <li><strong>Third-party sources:</strong> Payment processors and shipping partners (only with your consent)</li>
              <li><strong>Analytics tools:</strong> Google Analytics and Contentsquare (with your consent)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              4. Who We Share Information With
            </h2>
            <p className="mb-4">We only share your information with trusted partners necessary to provide our services:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm mb-4">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">Service Provider</th>
                    <th className="border border-border px-4 py-2 text-left">Purpose</th>
                    <th className="border border-border px-4 py-2 text-left">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">Supabase</td>
                    <td className="border border-border px-4 py-2">Database hosting & authentication</td>
                    <td className="border border-border px-4 py-2">Account data, orders</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2">Cloudinary</td>
                    <td className="border border-border px-4 py-2">Image hosting & delivery</td>
                    <td className="border border-border px-4 py-2">Product images, payment proofs</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Groq / Google (AI)</td>
                    <td className="border border-border px-4 py-2">AI chatbot functionality</td>
                    <td className="border border-border px-4 py-2">Chat messages (no PII)</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2">Google Analytics</td>
                    <td className="border border-border px-4 py-2">Website analytics</td>
                    <td className="border border-border px-4 py-2">Browsing data (anonymized)</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Contentsquare</td>
                    <td className="border border-border px-4 py-2">UX analytics</td>
                    <td className="border border-border px-4 py-2">Session data (anonymized)</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="border border-border px-4 py-2">Payment Processors</td>
                    <td className="border border-border px-4 py-2">Payment processing</td>
                    <td className="border border-border px-4 py-2">Payment information</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Shipping Partners</td>
                    <td className="border border-border px-4 py-2">Order delivery</td>
                    <td className="border border-border px-4 py-2">Name, address, phone</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p>We do not sell your personal information to third parties for marketing purposes.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              5. Data Retention Periods
            </h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account data:</strong> Retained until you delete your account or request deletion</li>
              <li><strong>Order history:</strong> Retained for 7 years (legal/tax requirements), then anonymized</li>
              <li><strong>Payment proofs:</strong> Retained for 90 days after order completion, then deleted</li>
              <li><strong>Chat messages:</strong> Retained for 90 days, then deleted</li>
              <li><strong>Analytics data:</strong> Retained for 26 months (Google Analytics default)</li>
              <li><strong>Inactive accounts:</strong> Flagged for review after 2 years of inactivity</li>
            </ul>
          </section>

          <section className="mb-10 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Download className="h-5 w-5" />
              6. Your Rights (GDPR & PECA)
            </h2>
            <p className="text-blue-800 dark:text-blue-200 mb-4">Under applicable data protection laws, you have the following rights:</p>
            <ul className="list-disc pl-6 mb-4 text-blue-800 dark:text-blue-200">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your data</li>
              <li><strong>Right to Data Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to certain processing of your data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent</li>
            </ul>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              To exercise these rights, visit your <a href="/profile" className="underline">Profile Settings</a> or contact us at ubaid0345@proton.me.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
            <p className="mb-4">We implement comprehensive security measures:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>256-bit SSL/TLS encryption for all data transmission</li>
              <li>Database encryption at rest</li>
              <li>Regular automated security backups</li>
              <li>Row Level Security (RLS) policies in our database</li>
              <li>Strict access controls for staff</li>
              <li>Regular security audits</li>
            </ul>
            <p className="text-sm">
              See our detailed <a href="/security" className="text-primary hover:underline">Security Page</a> for more information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
            <p>
              Your data may be processed on servers located outside of Pakistan. We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses and data processing agreements.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or through a prominent notice on our website. The "Last Updated" date at the top of this policy indicates when it was last revised.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">11. Contact for Privacy Questions</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact:
            </p>
            <div className="p-4 bg-muted rounded-xl">
              <p><strong>Data Protection Officer</strong><br />
              Khilafat Books<br />
              Main Rashid Minhas Road, Karachi, Pakistan<br />
              Email: <a href="mailto:ubaid0345@proton.me" className="text-primary hover:underline">ubaid0345@proton.me</a><br />
              WhatsApp: +92 345 2867726</p>
            </div>
          </section>

          {/* Legal Links */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-muted-foreground mb-2">Related Legal Documents:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>
              <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>
              <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>
              <a href="/disclaimer" className="text-primary hover:underline">Disclaimer</a>
              <a href="/security" className="text-primary hover:underline">Security</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
