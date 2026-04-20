# Security Sprint — Changes Summary

## 1. Headers & CSP (Task 1)
- **Harden CSP**: Added `frame-ancestors 'none'` to the Content-Security-Policy in `vercel.json` to prevent clickjacking.
- **Domain Coverage**: Verified that all external domains (`supabase.co`, `res.cloudinary.com`, `googletagmanager.com`, `google-analytics.com`, `connect.facebook.net`, `lh3.googleusercontent.com`, `api.dicebear.com`, `wa.me`) are properly allowlisted in the CSP.
- **Security Headers**: Confirmed `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security` are correctly set.

## 2. Bot Protection (Task 1)
- **AI Bot Blocking**: Updated `public/robots.txt` to explicitly disallow `GPTBot`, `CCBot`, `anthropic-ai`, `Claude-Web`, and `PerplexityBot`.
- **Sensitive Paths**: Ensured `/admin/`, `/checkout/`, `/account/`, `/orders/`, `/order-details/`, and `/cart/` are disallowed for all crawlers.

## 3. Access Control & Route Protection
- **Admin Hardening**: Modified `src/pages/Admin.tsx` to return `null` and trigger an immediate redirect to `/auth` for non-admin users, preventing unauthorized UI exposure.
- **Wishlist & Checkout Protection**: Implemented session-based redirects in `src/pages/Wishlist.tsx` and `src/pages/Checkout.tsx` to ensure only logged-in users can access these pages.
- **Existing Protection**: Verified that `Orders.tsx`, `Library.tsx`, and `OrderDetail.tsx` already correctly handle authentication redirects.

## 4. Storage Security (Task 2)
- **Bucket Privacy**: Verified `payment-proofs` and `digital-products` buckets are private via database migrations.
- **Payment Privacy Fix**: Fixed `src/pages/Checkout.tsx` to store only the file path for payment screenshots instead of generating a public URL, ensuring they remain protected in the private bucket.
- **Digital Downloads**: Audited the `download-digital-product` Edge Function; confirmed it strictly verifies `auth.uid()` against order ownership and enforces a secure 3600-second expiry for signed URLs.

## 5. Referral Abuse Protection (Task 3)
- **Unique Constraint**: Added a database migration `supabase/migrations/20270524000000_referral_abuse_fix.sql` to enforce a unique constraint on `(referred_user_id, referral_code_id)`, preventing users from being referred multiple times.
- **Self-Referral**: Confirmed that the `validate_referral_code` RPC already prevents users from using their own codes.
- **Audit Logging**: Verified the `referral_audit_log` table already exists and is actively used by the validation functions.

## 6. Dependency Security (Task 4)
- **Patched Vulnerabilities**: Addressed high-severity vulnerabilities in `lodash`, `picomatch`, `undici`, `flatted`, and `dompurify` using `pnpm overrides` in `package.json`.
- **Audit Status**: Verified that `pnpm audit` now shows zero HIGH or CRITICAL vulnerabilities.

## 7. Secrets Scan (Task 5)
- **Confirmed**: Performed a thorough scan of `src/` and confirmed no hardcoded secrets, API keys, or Supabase URLs are present. All configurations correctly use environment variables.

---
**Biggest Remaining Risk**: Sub-dependencies of build-time tools like `wrangler` and `@prerenderer` still contain moderate vulnerabilities that cannot be easily updated without potentially breaking the build pipeline; these should be monitored for upstream patches.

## 8. Security Audit — Critical & High Remediations (2026-04-20)
- **AI Chat Protection**: Secured the `ai-chat` Edge Function by removing the publishable key fallback and enforcing strict JWT authentication. Unauthenticated requests now return 401 immediately.
- **Registration Abuse Fix**: Mitigated open registration abuse by integrating reCAPTCHA v3 on the frontend and routing all new signups through a secure `signup` Edge Function that verifies CAPTCHA tokens before calling Supabase Auth.
- **Subresource Integrity (SRI)**: Added `integrity` and `crossorigin` attributes to the Contentsquare script in `index.html` to prevent potential supply-chain attacks.
- **Nonce-based CSP**: Configured `vite-plugin-csp` to inject cryptographic nonces into the Content-Security-Policy and all script tags. Updated `vercel.json` to enforce a stricter policy by removing `'unsafe-inline'` and `'unsafe-eval'` from script-src.
- **Performance Optimization**: Implemented code splitting using `React.lazy()` and Framer Motion's `LazyMotion` to reduce initial bundle size and mitigate potential client-side DoS risks.
- **Security Policy**: Added a `security.txt` file at `.well-known/security.txt` to provide clear contact information for vulnerability reporting.
- **Supabase Hardening**: Generated `supabase_security_fixes.sql` to enable RLS on all sensitive tables, enforce strict ownership-based policies, and restrict CORS origins to the production domain.
