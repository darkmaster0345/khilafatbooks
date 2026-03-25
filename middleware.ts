// Standard Web API based middleware for Vercel Edge
// This avoids dependency on 'next' package

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only apply rate limiting to sensitive routes
  const isSensitiveRoute =
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/search') ||
    pathname.includes('/auth') ||
    pathname.includes('/functions/v1/');

  if (isSensitiveRoute) {
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    const now = Date.now();

    const rateLimit = rateLimitMap.get(ip);

    if (!rateLimit || now > rateLimit.resetAt) {
      rateLimitMap.set(ip, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW
      });
    } else {
      rateLimit.count++;
      if (rateLimit.count > MAX_REQUESTS) {
        return new Response(
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

  // Pass-through
  return new Response(null, {
    headers: {
      'x-middleware-next': '1',
    },
  });
}

export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*',
    '/supabase/functions/:path*'
  ],
};
