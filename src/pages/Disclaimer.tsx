import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';
import { AlertTriangle, BookOpen, Bot, ExternalLink, Scale } from 'lucide-react';

const Disclaimer = () => {
  return (
    <>
      <SEOHead
        title="Disclaimer | Khilafat Books"
        description="Important disclaimers regarding Islamic content accuracy, AI assistance, professional advice, and external links on Khilafat Books."
      />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Disclaimer", href: "/disclaimer" }]} />

        <div className="mt-8 prose prose-slate max-w-none">
          <h1 className="font-display text-4xl font-bold mb-6">Disclaimer</h1>
          <p className="text-muted-foreground mb-8 italic">Last Updated: April 2026</p>

          {/* Islamic Content Accuracy */}
          <section className="mb-10 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl shrink-0">
                <BookOpen className="h-6 w-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-amber-900 dark:text-amber-100">Islamic Content Accuracy</h2>
                <p className="text-amber-800 dark:text-amber-200 mb-4">
                  <strong>Islamic content accuracy is not independently verified by Khilafat Books.</strong> While we strive to source authentic Islamic books from reputable publishers and scholars, we are a bookstore and not a religious authority.
                </p>
                <p className="text-amber-800 dark:text-amber-200 mb-4">
                  Readers should:
                </p>
                <ul className="list-disc pl-6 mb-4 text-amber-800 dark:text-amber-200">
                  <li>Cross-reference information with qualified Islamic scholars (Ulama, Muftis)</li>
                  <li>Verify religious rulings with certified Islamic institutions</li>
                  <li>Understand that interpretations may vary among different schools of thought</li>
                  <li>Consult local imams or religious teachers for contextual guidance</li>
                </ul>
              </div>
            </div>
          </section>

          {/* AI Assistant Disclaimer */}
          <section className="mb-10 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl shrink-0">
                <Bot className="h-6 w-6 text-blue-700 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-blue-900 dark:text-blue-100">AI Chatbot Disclaimer</h2>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  Our AI assistant (Khilafat Assistant) is powered by artificial intelligence and is provided for informational purposes only.
                </p>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  <strong>Important limitations:</strong>
                </p>
                <ul className="list-disc pl-6 mb-4 text-blue-800 dark:text-blue-200">
                  <li>The AI is NOT a qualified Islamic scholar and cannot provide religious rulings (fatwas)</li>
                  <li>The AI cannot answer questions about Islamic jurisprudence (Fiqh), halal/haram rulings, or religious obligations</li>
                  <li>For religious guidance, always consult a certified Mufti, Aalim, or qualified Islamic scholar</li>
                  <li>AI responses should not be used as a substitute for professional religious advice</li>
                  <li>The AI may occasionally provide inaccurate or incomplete information</li>
                </ul>
              </div>
            </div>
          </section>

          {/* No Professional Advice */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              No Professional Advice
            </h2>
            <p className="mb-4">
              The content on this website, including product descriptions, blog posts, and educational materials, is for general informational purposes only. It does not constitute:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Legal advice</strong> — Consult a qualified lawyer for legal matters</li>
              <li><strong>Medical advice</strong> — Consult a licensed physician for health concerns</li>
              <li><strong>Financial advice</strong> — Consult a certified financial advisor for investment decisions</li>
              <li><strong>Religious rulings</strong> — Consult a qualified Islamic scholar for religious matters</li>
            </ul>
          </section>

          {/* External Links */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ExternalLink className="h-6 w-6 text-primary" />
              External Links Disclaimer
            </h2>
            <p className="mb-4">
              Our website may contain links to external websites that are not provided or maintained by Khilafat Books. We do not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Guarantee the accuracy, relevance, timeliness, or completeness of any information on external websites</li>
              <li>Endorse the content, products, or services offered on external websites</li>
              <li>Control or monitor the privacy practices of external websites</li>
              <li>Assume responsibility for any damages or losses arising from external website usage</li>
            </ul>
            <p>
              Please review the terms of service and privacy policies of any external websites you visit.
            </p>
          </section>

          {/* Product Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Product Information</h2>
            <p className="mb-4">
              While we make every effort to ensure product information (including descriptions, prices, and availability) is accurate:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Occasional errors may occur</li>
              <li>Product images may differ slightly from actual items</li>
              <li>Prices are subject to change without notice</li>
              <li>We reserve the right to correct errors and cancel orders if necessary</li>
            </ul>
          </section>

          {/* Affiliate Disclosure */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Affiliate Disclosure</h2>
            <p className="mb-4">
              Some links on our website may be affiliate links. This means we may earn a small commission if you make a purchase through these links, at no additional cost to you. This helps support our platform and allows us to continue providing quality Islamic content.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by applicable law, Khilafat Books and its affiliates, officers, employees, agents, and suppliers shall not be liable for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Any loss of profits, revenue, data, or goodwill</li>
              <li>Any damages arising from your use of or inability to use our services</li>
              <li>Any errors or omissions in content, or any loss or damage from such errors</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this disclaimer, please contact us:
            </p>
            <p className="mt-4">
              <strong>Khilafat Books</strong><br />
              Main Rashid Minhas Road, Karachi, Pakistan<br />
              Email: support@khilafatbooks.com<br />
              WhatsApp: +92 345 2867726
            </p>
          </section>

          {/* Legal Links */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-muted-foreground mb-2">Related Legal Documents:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
              <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>
              <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>
              <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>
              <a href="/security" className="text-primary hover:underline">Security</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Disclaimer;
