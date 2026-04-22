import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Shield, Lock, Key, Bell, AlertTriangle, UserCheck, Server, FileCheck, Mail } from 'lucide-react';

const Security = () => {
  return (
    <>
      <SEOHead
        title="Security | Khilafat Books"
        description="Learn about the security measures we implement to protect your data and ensure safe transactions on Khilafat Books."
      />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Security", href: "/security" }]} />

        <div className="mt-8 prose prose-slate max-w-none">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold">Security</h1>
              <p className="text-muted-foreground">How we protect your data and transactions</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-8 italic">Last Updated: April 2026</p>

          {/* SSL/TLS Encryption */}
          <section className="mb-10 p-6 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl shrink-0">
                <Lock className="h-6 w-6 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-green-900 dark:text-green-100">SSL/TLS Encryption</h2>
                <p className="text-green-800 dark:text-green-200 mb-4">
                  All data transmitted between your browser and our servers is protected with industry-standard <strong>256-bit SSL/TLS encryption</strong>. This ensures that:
                </p>
                <ul className="list-disc pl-6 mb-4 text-green-800 dark:text-green-200">
                  <li>Your login credentials are encrypted during transmission</li>
                  <li>Payment information is securely protected</li>
                  <li>Personal data remains confidential during transit</li>
                  <li>All pages use HTTPS (Hypertext Transfer Protocol Secure)</li>
                </ul>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Look for the padlock icon (🔒) in your browser's address bar to verify you're on a secure connection.
                </p>
              </div>
            </div>
          </section>

          {/* Authentication Measures */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Key className="h-6 w-6 text-primary" />
              Authentication & Access Control
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-semibold mb-2">Secure Authentication</h4>
                <p className="text-sm">We use Supabase Auth with industry-standard security practices including:</p>
                <ul className="list-disc pl-6 text-sm mt-2">
                  <li>Password hashing using bcrypt</li>
                  <li>JWT (JSON Web Token) based session management</li>
                  <li>Secure token storage</li>
                  <li>Automatic session expiration</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-semibold mb-2">Password Security</h4>
                <p className="text-sm">We enforce strong password requirements:</p>
                <ul className="list-disc pl-6 text-sm mt-2">
                  <li>Minimum 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                  <li>Common passwords are blocked</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-semibold mb-2">Account Protection</h4>
                <ul className="list-disc pl-6 text-sm">
                  <li><strong>Failed login attempt protection:</strong> Account temporarily locked after 5 failed attempts</li>
                  <li><strong>New device notifications:</strong> Email alerts when logging in from a new device</li>
                  <li><strong>Session management:</strong> View and revoke active sessions from your profile</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Email Verification */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Email Verification
            </h2>
            <p className="mb-4">
              Email verification is required for all accounts before making purchases. This helps us:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Confirm your identity</li>
              <li>Protect against fraudulent accounts</li>
              <li>Ensure order confirmations reach the correct recipient</li>
              <li>Enable account recovery options</li>
            </ul>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> You can still browse and add items to your cart without verifying your email, but checkout requires a verified email address.
              </p>
            </div>
          </section>

          {/* Breach Notification */}
          <section className="mb-10 p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-xl shrink-0">
                <Bell className="h-6 w-6 text-red-700 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-red-900 dark:text-red-100">Breach Notification Policy</h2>
                <p className="text-red-800 dark:text-red-200 mb-4">
                  We take data breaches extremely seriously. In the event of a security incident affecting your personal data:
                </p>
                <ul className="list-disc pl-6 mb-4 text-red-800 dark:text-red-200">
                  <li><strong>Within 72 hours:</strong> We will notify all affected users via email</li>
                  <li>We will provide clear details about what data was affected</li>
                  <li>We will outline the steps we're taking to address the breach</li>
                  <li>We will provide recommendations for protecting yourself</li>
                  <li>We will report the breach to relevant authorities as required by law</li>
                </ul>
                <p className="text-sm text-red-700 dark:text-red-300">
                  We will never ask for your password via email. Always verify the sender's email address is from @khilafatbooks.com.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              Data Storage & Security
            </h2>
            <div className="space-y-4">
              <p>
                Your data is stored securely using Supabase (hosted on AWS infrastructure) with the following protections:
              </p>
              <ul className="list-disc pl-6">
                <li>Database encryption at rest</li>
                <li>Regular automated backups</li>
                <li>Row Level Security (RLS) policies to prevent unauthorized access</li>
                <li>Strict access controls for our internal team</li>
                <li>Regular security audits and penetration testing</li>
              </ul>
            </div>
          </section>

          {/* Payment Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              Payment Security
            </h2>
            <p className="mb-4">
              For payment processing, we partner with trusted, PCI-DSS compliant payment providers. We do not store complete credit card details on our servers.
            </p>
            <p className="mb-4">
              For manual payments (EasyPaisa, JazzCash, Bank Transfer), we only store proof of payment (transaction screenshots) which are:
            </p>
            <ul className="list-disc pl-6">
              <li>Stored in secure, encrypted cloud storage</li>
              <li>Accessible only to authorized order processing staff</li>
              <li>Deleted after order completion per our retention policy</li>
            </ul>
          </section>

          {/* User Security Tips */}
          <section className="mb-10 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl shrink-0">
                <UserCheck className="h-6 w-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-amber-900 dark:text-amber-100">Security Tips for Users</h2>
                <p className="text-amber-800 dark:text-amber-200 mb-4">
                  Help protect your account by following these best practices:
                </p>
                <ul className="list-disc pl-6 mb-4 text-amber-800 dark:text-amber-200">
                  <li>Use a strong, unique password for your Khilafat Books account</li>
                  <li>Enable email verification and keep your email address current</li>
                  <li>Don't share your login credentials with anyone</li>
                  <li>Log out when using shared or public computers</li>
                  <li>Monitor your account for any suspicious activity</li>
                  <li>Keep your browser and operating system up to date</li>
                  <li>Be cautious of phishing emails claiming to be from Khilafat Books</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Vulnerability Disclosure */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Reporting Security Vulnerabilities
            </h2>
            <p className="mb-4">
              We welcome responsible disclosure of security vulnerabilities. If you discover a security issue:
            </p>
            <ol className="list-decimal pl-6 mb-4">
              <li><strong>Do not exploit</strong> the vulnerability or access others' data</li>
              <li><strong>Do not share</strong> the vulnerability publicly until it's fixed</li>
              <li><strong>Email us immediately</strong> at <a href="mailto:ubaid0345@proton.me" className="text-primary hover:underline">ubaid0345@proton.me</a></li>
              <li>Include detailed steps to reproduce the issue</li>
              <li>Allow us reasonable time to investigate and fix before disclosing publicly</li>
            </ol>
            <p className="mb-4">
              We commit to:
            </p>
            <ul className="list-disc pl-6">
              <li>Acknowledge receipt of your report within 48 hours</li>
              <li>Provide an estimated timeline for fixes</li>
              <li>Credit you (if desired) in our security advisories</li>
            </ul>
          </section>

          {/* Compliance */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Compliance & Certifications</h2>
            <p className="mb-4">We adhere to the following security standards and regulations:</p>
            <ul className="list-disc pl-6">
              <li><strong>PECA 2016:</strong> Pakistan Electronic Crimes Act compliance</li>
              <li><strong>GDPR:</strong> General Data Protection Regulation (for international users)</li>
              <li><strong>PCI-DSS:</strong> Payment Card Industry Data Security Standards (via our payment processors)</li>
              <li><strong>SOC 2 Type II:</strong> Our infrastructure provider maintains SOC 2 compliance</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Contact Our Security Team</h2>
            <p className="mb-4">
              For security-related inquiries or to report issues:
            </p>
            <div className="space-y-2">
              <p><strong>General Security:</strong> <a href="mailto:ubaid0345@proton.me" className="text-primary hover:underline">ubaid0345@proton.me</a></p>
              <p><strong>General Support:</strong> <a href="mailto:ubaid0345@proton.me" className="text-primary hover:underline">ubaid0345@proton.me</a></p>
              <p><strong>WhatsApp:</strong> +92 345 2867726</p>
            </div>
          </section>

          {/* Legal Links */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-muted-foreground mb-2">Related Legal Documents:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
              <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>
              <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>
              <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>
              <a href="/disclaimer" className="text-primary hover:underline">Disclaimer</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Security;
