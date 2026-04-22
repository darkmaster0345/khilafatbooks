// Search engine and social media bot user agents
const BOT_AGENTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'whatsapp',
  'linkedinbot', 'pinterestbot', 'telegrambot', 'applebot',
  'ahrefsbot', 'semrushbot', 'mj12bot',
]

// Note: Admin route protection is handled client-side in the Admin component
// Server-side middleware cannot access SPA auth tokens on initial page load

/**
 * Vercel Edge Middleware (Standard Web API)
 *
 * This middleware:
 * 1. Detects search engine bots and rewrites them to pre-rendered static HTML snapshots
 * Note: Admin auth is handled client-side - server cannot verify SPA tokens on initial load
 */
export default async function middleware(request: Request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const ua = request.headers.get('user-agent')?.toLowerCase() ?? ''

  // Bot Detection & Prerendering Rewrite
  const isBot = BOT_AGENTS.some(bot => ua.includes(bot))

  if (isBot) {
    // Rewrite bots to pre-built static HTML snapshots
    // e.g., /books/some-book -> /_prerendered/books/some-book.html
    const rewritePath = `/_prerendered${pathname === '/' ? '/index' : pathname}.html`
    url.pathname = rewritePath

    // Standard Vercel rewrite header
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': url.toString(),
      },
    })
  }

  // Continue to the SPA
  return new Response(null, {
    headers: {
      'x-middleware-next': '1',
    },
  })
}

// Optimization: Only run middleware on non-static routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (Next.js assets, though this is a Vite project, keeping it safe)
     * - _prerendered (Our snapshots)
     * - favicon.ico, robots.txt, sitemap.xml
     * - static files (anything with a dot in the last segment)
     */
    '/((?!_next|_prerendered|favicon|robots|sitemap|.*\\..*).*)',
  ],
}
