## 2026-03-09 - [Standardized Input Validation & Secure Headers]
**Vulnerability:** Weak input validation and missing security headers.
**Learning:** Initial scan revealed that while the backend (Supabase) has RLS, the frontend was too permissive with inputs (mobile numbers, emails), and the application lacked standard HTTP security headers (CSP, X-Frame-Options), leaving it vulnerable to XSS, Clickjacking, and spam.
**Prevention:** Always implement "fail-secure" frontend validation using strict regex for region-specific data (e.g., Pakistan mobile numbers) and enforce security headers via the hosting provider's configuration (e.g., `vercel.json`).
