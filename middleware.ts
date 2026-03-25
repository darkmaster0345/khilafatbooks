import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

// Simple in-memory cache for rate limiting
// Note: In a real Vercel environment, this cache is per-isolate.
// For robust multi-region rate limiting, Vercel KV is recommended.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to sensitive routes
  // We include /api/login and /api/search as requested, plus auth-related paths
  const isSensitiveRoute =
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/search') ||
    pathname.includes('/auth') ||
    pathname.includes('/functions/v1/');

  if (isSensitiveRoute) {
    const ip = request.ip || 'anonymous';
    const now = Date.now();

    const rateLimit = rateLimitMap.get(ip);

    if (!rateLimit || now > rateLimit.resetAt) {
      // New window or first request
      rateLimitMap.set(ip, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW
      });
    } else {
      // Increment count
      rateLimit.count++;

      if (rateLimit.count > MAX_REQUESTS) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((rateLimit.resetAt - now) / 1000).toString()
            }
          }
        );
      }
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*',
    '/supabase/functions/:path*'
  ],
};
