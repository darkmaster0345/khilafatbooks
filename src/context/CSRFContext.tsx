import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface CSRFContextType {
  token: string | null;
  getToken: () => string | null;
  refreshToken: () => void;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  // Generate a new CSRF token
  const generateToken = useCallback(() => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }, []);

  // Get token from cookie or generate new one
  const getTokenFromCookie = useCallback(() => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME) {
        return value;
      }
    }
    return null;
  }, []);

  // Set CSRF token in cookie (accessible to JS for SPA, SameSite=Lax)
  const setTokenCookie = useCallback((newToken: string) => {
    // SameSite=Lax allows JS access while providing CSRF protection
    // Secure flag only on HTTPS
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${CSRF_COOKIE_NAME}=${newToken}; SameSite=Lax; Path=/; ${isSecure ? 'Secure;' : ''} Max-Age=86400`;
  }, []);

  // Initialize or refresh CSRF token
  const refreshToken = useCallback(() => {
    const existingToken = getTokenFromCookie();
    if (existingToken) {
      setToken(existingToken);
    } else {
      const newToken = generateToken();
      setTokenCookie(newToken);
      setToken(newToken);
    }
  }, [generateToken, getTokenFromCookie, setTokenCookie]);

  // Get current token
  const getToken = useCallback(() => {
    return token || getTokenFromCookie();
  }, [token, getTokenFromCookie]);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  return (
    <CSRFContext.Provider value={{ token, getToken, refreshToken }}>
      {children}
    </CSRFContext.Provider>
  );
}

export function useCSRF() {
  const context = useContext(CSRFContext);
  if (context === undefined) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
}

// Export constants for use in API calls
export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
