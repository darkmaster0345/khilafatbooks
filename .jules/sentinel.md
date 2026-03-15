# Sentinel Journal

## Critical Security Fixes
- **2024-05-22**: Fixed a vulnerability where Supabase OAuth access tokens remained in the URL hash after login.
  - **Initial Mitigation**: Added a cleanup mechanism in `src/hooks/useAuth.tsx` using `window.history.replaceState` to strip the hash immediately after the session is established.
  - **Root Cause Fix**: Identified that `skipBrowserRedirect: true` in `signInWithGoogle` was forcing an implicit flow. Simplified the OAuth configuration to use Supabase's native redirect handling, which avoids putting sensitive tokens in the URL hash entirely. Updated `redirectTo` to `/auth` for better consistency.

## Permanent Security Scan List (Auth)
- [ ] **No URL Hash Exposure**: After any auth-related change, verify that `access_token` never appears in the URL hash after OAuth login.
- [ ] **Hash Cleanup**: Verify that `window.location.hash` cleanup logic exists and is active within the `onAuthStateChange` listener in `src/hooks/useAuth.tsx`.
- [ ] **Dynamic Redirects**: Verify `redirectTo` (and `emailRedirectTo`) always uses `window.location.origin` instead of any hardcoded domain to prevent cross-environment redirect issues.
