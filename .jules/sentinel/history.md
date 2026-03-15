# Sentinel Security History

## Confirmed Past Vulnerabilities (Resolved)

### JWT Access Token Exposure in URL Hash
- **Date Fixed**: 2024-05-22
- **Description**: A live JWT access token was exposed in the browser URL after Google OAuth login. This occurred because the application was inadvertently using the implicit OAuth flow (likely due to `skipBrowserRedirect: true` or misconfiguration in `signInWithOAuth`).
- **Impact**: Exposure of sensitive access tokens in the browser history and logs, potentially allowing for account takeover if the URL was intercepted or leaked.
- **Resolution**:
    - Switched to the standard OAuth flow by simplifying the Supabase OAuth configuration.
    - Added a cleanup mechanism in `onAuthStateChange` to strip the URL hash if an `access_token` is present.
    - Standardized `redirectTo` to use `window.location.origin` to ensure consistent and safe redirects.
- **Permanent Verification Requirements**:
    1. Verify that `access_token` never appears in the URL hash after OAuth login.
    2. Check that `window.location.hash` cleanup exists in `onAuthStateChange`.
    3. Verify `redirectTo` always uses `window.location.origin`, not a hardcoded domain.
