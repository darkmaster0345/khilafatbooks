# Sentinel Journal

## Critical Security Fixes
- **2024-05-22**: Fixed a vulnerability where Supabase OAuth access tokens remained in the URL hash after login. Added a cleanup mechanism in `src/hooks/useAuth.tsx` using `window.history.replaceState` to strip the hash immediately after the session is established. This prevents token leakage into browser history, logs, and analytics.
