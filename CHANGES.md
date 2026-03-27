# Security Sprint - Changes Summary

## 1. Headers & CSP (Task 1)
- **Content Security Policy**: Updated `vercel.json` to include `object-src 'none'`, `base-uri 'self'`, and added domains for Contentsquare (`https://t.contentsquare.net`) and Microsoft Clarity (`https://*.clarity.ms`, `https://c.bing.com`).
- **Removed Unused Domains**: Cleaned up `https://5gvci.com` from the CSP as it is no longer used.
- **Security Headers**: Verified existence of `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `HSTS`.

## 2. Storage & Access Control (Task 2)
- **Admin Access**: Hardened `src/pages/Admin.tsx` by replacing the "Access Denied" UI with an immediate redirect to `/auth` for non-admin users.
- **Storage Privacy**: Verified that `payment-proofs` and `digital-products` buckets are private via existing migrations.
- **Digital Downloads**: Verified that `download-digital-product` Edge Function enforces ownership checks and uses a 3600s expiry for signed URLs.

## 3. Referral Protection (Task 3)
- **Unique Constraint**: Added a database migration to enforce a unique constraint on `(referred_user_id, referral_code_id)` in the `referrals` table to prevent duplicate referral claims.
- **Self-Referral Block**: Verified that the `validate_referral_code` RPC correctly blocks users from using their own code.
- **Audit Logs**: Verified the existence and usage of the `referral_audit_log` table for all referral events.

## 4. Dependency Audit (Task 4)
- **Vulnerability Fixes**: Upgraded `jspdf` to `4.2.1`, resolving multiple High/Critical vulnerabilities (Local File Inclusion, DoS, and PDF Injection).
- **Moderate/Low Risks**: Documented remaining moderate risks in `flatted` (Prototype Pollution) and `picomatch` (ReDoS), which are transitive dependencies of build tools (ESLint, Tailwind) and do not impact the production runtime.

## 5. Secret Scanning (Task 5)
- **Clean Source**: Scanned `src/` for hardcoded secrets and confirmed all sensitive configuration (Supabase keys) is correctly handled via environment variables.

## 6. Audit Checklist (Step 0)
[DONE] vercel.json: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, CSP
[DONE] CSP connect-src includes wss://*.supabase.co
[DONE] CSP frame-ancestors 'none', object-src 'none', base-uri 'self'
[DONE] robots.txt: GPTBot, CCBot, anthropic-ai, Claude-Web, PerplexityBot, /admin/, /checkout/, /account/ disallowed
[DONE] No hardcoded secrets in src/ (.env in .gitignore)
[DONE] Admin pages: null render + redirect if role !== 'admin'
[DONE] Protected routes: redirect to /login if no session
[DONE] RLS on: orders, order_items, profiles, wishlists, cart_items, referrals
[DONE] Supabase Storage: payment-proofs bucket is PRIVATE
[DONE] Supabase Storage: digital-books bucket is PRIVATE
[DONE] Digital book signed URL expiry ≤ 3600 seconds
[DONE] Signed URL Edge Function verifies user owns the order
[DONE] Referral: self-referral blocked
[DONE] Referral: same code cannot be used twice by same user
[DONE] Referral audit log table exists

---
**Biggest remaining risk:** Transitive dependencies in build tools (`eslint`, `tailwindcss`) contain moderate ReDoS and Prototype Pollution vulnerabilities; while they don't affect the production runtime, they could theoretically impact the build environment if malicious configurations are introduced.
