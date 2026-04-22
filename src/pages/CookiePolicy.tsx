import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Cookie, Info, Trash2, Shield } from 'lucide-react';

const CookiePolicy = () => {
  const cookieTable = [
    {
      name: 'kb_cookie_consent',
      category: 'Necessary',
      purpose: 'Stores your cookie consent preferences',
      duration: '1 year',
      domain: 'khilafatbooks.com',
    },
    {
      name: 'sb-access-token',
      category: 'Necessary',
      purpose: 'Authentication session token for logged-in users',
      duration: 'Session',
      domain: 'khilafatbooks.com',
    },
    {
      name: 'sb-refresh-token',
      category: 'Necessary',
      purpose: 'Token to refresh authentication session',
      duration: 'Session',
      domain: 'khilafatbooks.com',
    },
    {
      name: '_ga',
      category: 'Analytics',
      purpose: 'Google Analytics - distinguishes users',
      duration: '2 years',
      domain: '.khilafatbooks.com',
    },
    {
      name: '_gid',
      category: 'Analytics',
      purpose: 'Google Analytics - distinguishes users for 24 hours',
      duration: '24 hours',
      domain: '.khilafatbooks.com',
    },
    {
      name: '_gat',
      category: 'Analytics',
      purpose: 'Google Analytics - throttles request rate',
      duration: '1 minute',
      domain: '.khilafatbooks.com',
    },
    {
      name: 'cs_id',
      category: 'Marketing/Analytics',
      purpose: 'Contentsquare - user identification for UX analytics',
      duration: '1 year',
      domain: '.khilafatbooks.com',
    },
    {
      name: 'cart_items',
      category: 'Preferences',
      purpose: 'Stores cart items for non-logged-in users',
      duration: '7 days',
      domain: 'khilafatbooks.com',
    },
    {
      name: 'wishlist',
      category: 'Preferences',
      purpose: 'Stores wishlist items for non-logged-in users',
      duration: '30 days',
      domain: 'khilafatbooks.com',
    },
    {
      name: 'theme_preference',
      category: 'Preferences',
      purpose: 'Stores user theme preference (light/dark mode)',
      duration: '1 year',
      domain: 'khilafatbooks.com',
    },
  ];

  return (
    <>
      <SEOHead
        title="Cookie Policy | Khilafat Books"
        description="Learn about how Khilafat Books uses cookies and similar technologies to enhance your browsing experience."
      />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Cookie Policy", href: "/cookie-policy" }]} />

        <div className="mt-8 prose prose-slate max-w-none">
          <h1 className="font-display text-4xl font-bold mb-6 flex items-center gap-3">
            <Cookie className="h-10 w-10 text-primary" />
            Cookie Policy
          </h1>
          <p className="text-muted-foreground mb-8 italic">Last Updated: April 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your browsing experience.
            </p>
            <p>
              We also use similar technologies like local storage and session storage for storing information locally on your device.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">How We Use Cookies</h2>
            <p className="mb-4">Khilafat Books uses cookies for the following purposes:</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Necessary Cookies
                </h3>
                <p>These cookies are essential for the website to function properly. They enable core features like user authentication, session management, and shopping cart functionality. The website cannot function properly without these cookies.</p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Analytics Cookies
                </h3>
                <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. We use Google Analytics and Contentsquare to improve our website and user experience.</p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-purple-500" />
                  Marketing Cookies
                </h3>
                <p>These cookies are used to track visitors across websites to display relevant advertisements and measure their effectiveness. Currently, we use Contentsquare for UX analytics which may fall under this category.</p>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-orange-500" />
                  Preference Cookies
                </h3>
                <p>These cookies enable the website to remember your preferences (such as theme selection, cart contents, and wishlist) to provide enhanced, personalized functionality.</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Cookie Inventory</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left font-semibold">Cookie Name</th>
                    <th className="border border-border px-4 py-3 text-left font-semibold">Category</th>
                    <th className="border border-border px-4 py-3 text-left font-semibold">Purpose</th>
                    <th className="border border-border px-4 py-3 text-left font-semibold">Duration</th>
                    <th className="border border-border px-4 py-3 text-left font-semibold">Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieTable.map((cookie, index) => (
                    <tr key={cookie.name} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="border border-border px-4 py-3 font-mono text-xs">{cookie.name}</td>
                      <td className="border border-border px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          cookie.category === 'Necessary' ? 'bg-primary/10 text-primary' :
                          cookie.category === 'Analytics' ? 'bg-blue-100 text-blue-700' :
                          cookie.category === 'Marketing' || cookie.category === 'Marketing/Analytics' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {cookie.category}
                        </span>
                      </td>
                      <td className="border border-border px-4 py-3">{cookie.purpose}</td>
                      <td className="border border-border px-4 py-3">{cookie.duration}</td>
                      <td className="border border-border px-4 py-3 font-mono text-xs">{cookie.domain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <p className="mb-4">We use cookies from the following third-party services:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Google Analytics</strong> — For website traffic analysis and user behavior insights</li>
              <li><strong>Contentsquare</strong> — For user experience analytics and session recording</li>
              <li><strong>Supabase</strong> — For authentication and database services</li>
            </ul>
            <p>These services may use their own cookies in accordance with their privacy policies.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Managing Your Cookie Preferences</h2>
            <div className="p-4 bg-muted rounded-xl mb-4">
              <p className="mb-4">
                You can change your cookie preferences at any time by clicking the button below:
              </p>
              <button 
                onClick={() => {
                  // Remove consent cookie to trigger banner
                  document.cookie = 'kb_cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Cookie className="h-4 w-4" />
                Manage Cookie Preferences
              </button>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              How to Clear Cookies
            </h2>
            <p className="mb-4">You can clear cookies from your browser at any time. Here's how:</p>
            
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-xl">
                <h4 className="font-semibold mb-2">Google Chrome</h4>
                <ol className="list-decimal pl-6 text-sm">
                  <li>Click the menu (⋮) in the top-right corner</li>
                  <li>Select "Settings" → "Privacy and security"</li>
                  <li>Click "Clear browsing data"</li>
                  <li>Select "Cookies and other site data"</li>
                  <li>Click "Clear data"</li>
                </ol>
              </div>

              <div className="p-4 border border-border rounded-xl">
                <h4 className="font-semibold mb-2">Mozilla Firefox</h4>
                <ol className="list-decimal pl-6 text-sm">
                  <li>Click the menu (☰) in the top-right corner</li>
                  <li>Select "Settings" → "Privacy & Security"</li>
                  <li>Under "Cookies and Site Data", click "Clear Data"</li>
                  <li>Select "Cookies and Site Data" and click "Clear"</li>
                </ol>
              </div>

              <div className="p-4 border border-border rounded-xl">
                <h4 className="font-semibold mb-2">Safari (macOS)</h4>
                <ol className="list-decimal pl-6 text-sm">
                  <li>Click "Safari" in the menu bar</li>
                  <li>Select "Preferences" → "Privacy"</li>
                  <li>Click "Manage Website Data"</li>
                  <li>Click "Remove All" or select specific sites</li>
                </ol>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. When we make significant changes, we will notify you by updating the "Last Updated" date at the top of this policy and, where appropriate, through a banner on our website.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies, please contact us:
            </p>
            <p>
              <strong>Khilafat Books</strong><br />
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
              <a href="/disclaimer" className="text-primary hover:underline">Disclaimer</a>
              <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>
              <a href="/security" className="text-primary hover:underline">Security</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CookiePolicy;
