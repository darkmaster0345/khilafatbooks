import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Search engine and social media bot user agents
const BOT_AGENTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'whatsapp',
  'linkedinbot', 'pinterestbot', 'telegrambot', 'applebot',
  'ahrefsbot', 'semrushbot', 'mj12bot',
]

// Rate limiting state (Note: Edge Middleware is ephemeral, so this is per-instance)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname
  const ua = request.headers.get('user-agent')?.toLowerCase() ?? ''

  // 1. Bot Detection & Prerendering Rewrite
  const isBot = BOT_AGENTS.some(bot => ua.includes(bot))
  if (isBot) {
    // Rewrite bots to pre-built static HTML snapshots
    // e.g., /products/some-book -> /_prerendered/products/some-book.html
    url.pathname = `/_prerendered${pathname === '/' ? '/index' : pathname}.html`
    return NextResponse.rewrite(url)
  }

  // 2. Rate Limiting for Sensitive Routes
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - _prerendered
     * - favicon.ico, robots.txt, sitemap.xml
     * - static files (extension with dot)
     */
    '/((?!_next|_prerendered|favicon|robots|sitemap|.*\\..*).*)',
  ],
}
