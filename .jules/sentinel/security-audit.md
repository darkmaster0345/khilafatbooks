# Comprehensive Security Audit Report - Khilafat Books

**Date:** 2026-03-20
**Status:** Complete
**Auditor:** Jules (AI Software Engineer)

## 1. EXPOSED SECRETS IN CODE
- **Finding:** No active API keys, tokens, or passwords found in the codebase.
- **Rating:** **LOW**
- **Location:** Codebase-wide scan (grep, git log).
- **Impact:** Low risk of credential theft from the source code.
- **Observation:** Pinterest domain verification tokens in `index.html` are public by design.
- **Recommendation:** Continue using environment variables for all secrets.

## 2. OAUTH & AUTH SECURITY
- **Finding:** Authentication flow is properly hardened.
- **Rating:** **SECURE**
- **Location:** `src/integrations/supabase/client.ts`, `src/hooks/useAuth.tsx`
- **Impact:** PKCE flow prevents authorization code interception. Hash cleanup prevents access token leakage in browser history.
- **Observation:** Verified `flowType: 'pkce'`, hash cleanup logic, and `window.location.origin` for redirects.

## 3. SUPABASE SECURITY
- **Finding 3.1:** RLS is enabled on all 23 tables. Policies correctly restrict data to owners or admins.
- **Rating:** **SECURE**
- **Finding 3.2:** `SECURITY DEFINER` functions (`is_admin`, `has_role`, etc.) are hardened with `SET search_path = public, pg_catalog`.
- **Rating:** **SECURE**
- **Finding 3.3:** High-risk Edge Function authorization gaps.
- **Rating:** **HIGH**
- **Location:** `supabase/functions/ai-chat/index.ts`, `supabase/functions/privacy-cleanup/index.ts`, `supabase/functions/cart-recovery/index.ts`, `supabase/functions/notify-pledgers/index.ts`, `supabase/config.toml`, `src/components/admin/AdminBookRequests.tsx`
- **Impact:**
  - `ai-chat` can be abused for resource exhaustion (AI credits).
  - `privacy-cleanup` can be triggered by anyone if the URL is discovered.
  - `cart-recovery` is deployed with `verify_jwt = false` and uses service-role + Resend credentials without request authentication, allowing anonymous callers to trigger recovery-email workflows and mutate `abandoned_carts`.
  - `notify-pledgers` accepts client input, uses service-role privileges, emails all pledgers, and marks requests as fulfilled without an `is_admin`/ownership check; because the admin UI invokes it from the browser, any authenticated user can call the endpoint directly.
- **Recommendation:** Implement `auth.getUser()` + explicit role/ownership checks for privileged functions (especially `notify-pledgers`), and require signed authorization (JWT or shared secret) for automation functions like `privacy-cleanup` and `cart-recovery`. Keep `verify_jwt = false` only for endpoints that still perform robust in-function authentication/authorization checks.
- **Finding 3.4:** Storage buckets `payment-proofs` and `digital-products` are correctly set to private.
- **Rating:** **SECURE**

## 4. API KEYS IN CLIENT CODE
- **Finding:** Only publishable/anon keys are present in frontend code.
- **Rating:** **SECURE**
- **Location:** `src/integrations/supabase/client.ts`, `.env`
- **Observation:** `VITE_` variables contain non-sensitive identifiers only.

## 5. CONTENT SECURITY POLICY
- **Finding:** CSP headers contain `unsafe-inline` and `unsafe-eval`.
- **Rating:** **MEDIUM**
- **Location:** `vercel.json`
- **Impact:** Increases risk of XSS if a vulnerability is found elsewhere. These are likely required for GTM and Facebook Pixel but should be audited for replacement with nonces.
- **Recommendation:** Attempt to remove `unsafe-eval` and use nonces/hashes for inline scripts.

## 6. NETWORK & HEADERS
- **Finding:** Standard security headers (HSTS, XFO, Nosniff) are correctly configured.
- **Rating:** **SECURE**
- **Location:** `vercel.json`
- **Impact:** Protection against clickjacking, MIME-sniffing, and downgrade attacks.

## 7. INPUT VALIDATION
- **Finding:** Multi-layered validation is implemented.
- **Rating:** **SECURE**
- `Checkout.tsx`: Client-side file validation.
- `create_verified_order`: Server-side price and stock verification.
- Database: `CHECK` constraints for length, format (regex), and ranges.
- **Impact:** Prevents malformed or malicious data from reaching the database.

## 8. DIGITAL PRODUCT SECURITY
- **Finding 8.1:** Ownership verification is robust in both RPC and Edge Function.
- **Rating:** **SECURE**
- **Finding 8.2:** Inconsistency in signed URL generation.
- **Rating:** **MEDIUM**
- **Location:** `src/pages/OrderDetail.tsx`, `src/pages/Orders.tsx` vs `src/pages/Library.tsx`
- **Impact:** `OrderDetail.tsx` calls the RPC which returns a raw path, then tries to generate a signed URL client-side. This may fail if the user's RLS doesn't allow `storage.objects` selection (and the bucket is admin-only).
- **Recommendation:** Standardize on using the `download-digital-product` Edge Function for all download link generation.
