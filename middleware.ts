// Search engine and social media bot user agents
const BOT_AGENTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'whatsapp',
  'linkedinbot', 'pinterestbot', 'telegrambot', 'applebot',
  'ahrefsbot', 'semrushbot', 'mj12bot',
]

// SECURITY FIX (VULNERABILITY 6): Admin route protection
// Protect /admin routes server-side - return 403 for non-admins
async function checkAdminAccess(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware')
    return false
  }

  try {
    // Verify the JWT token with Supabase
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ApiKey': supabaseKey,
      },
    })

    if (!response.ok) {
      return false
    }

    const userData = await response.json()

    // Check admin status via app_metadata or user_roles
    const isAdmin =
      userData.app_metadata?.role === 'admin' ||
      userData.role === 'admin' ||
      (userData.user_metadata?.is_admin === true)

    return isAdmin
  } catch (error) {
    console.error('Error checking admin access:', error)
    return false
  }
}

/**
 * Vercel Edge Middleware (Standard Web API)
 *
 * This middleware:
 * 1. Detects search engine bots and rewrites them to pre-rendered static HTML snapshots
 * 2. Protects /admin routes server-side - returns 403 for non-admins
 */
export default async function middleware(request: Request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const ua = request.headers.get('user-agent')?.toLowerCase() ?? ''

  // SECURITY FIX (VULNERABILITY 6): Admin route protection
  if (pathname.startsWith('/admin')) {
    const isAdmin = await checkAdminAccess(request)
    if (!isAdmin) {
      // Return 403 Forbidden for admin routes when not authenticated as admin
      return new Response('Forbidden - Admin access required', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Admin-Required': 'true',
        },
      })
    }
  }

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
