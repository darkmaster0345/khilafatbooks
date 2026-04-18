import Prerenderer from '@prerenderer/prerenderer'
import JSDomRenderer from '@prerenderer/renderer-jsdom'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import jsdom from 'jsdom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const DIST = path.resolve(__dirname, '../dist')
const OUTPUT = path.resolve(DIST, '_prerendered')

// Static routes — always prerender these
const STATIC_ROUTES = [
  '/',
  '/shop',
  '/book-requests',
  '/faq',
  '/shipping-policy',
  '/return-policy',
  '/cart',
]

async function getProductRoutes(): Promise<string[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey || supabaseKey.includes('YOUR_NEW_PUBLISHABLE_KEY')) {
    console.warn('⚠️  Supabase env vars not set correctly — skipping dynamic product routes')
    return []
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?select=name&is_hidden=eq.false`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    if (!res.ok) throw new Error(`Supabase error: ${res.statusText}`)
    const data = await res.json() as { name: string }[]

    // Slugify helper
    const slugify = (text: string) => text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-')

    return data.map(p => `/books/${slugify(p.name)}`)
  } catch (e) {
    console.warn('⚠️  Could not fetch product slugs:', e)
    return []
  }
}

async function run() {
  console.log('🔍 Fetching routes...')
  try {
    const productRoutes = await getProductRoutes()
    const allRoutes = [...STATIC_ROUTES, ...productRoutes]

    console.log(`📄 Prerendering ${allRoutes.length} routes...`)

    // Custom resource loader to skip stylesheets
    class SkipStylesheetsResourceLoader extends jsdom.ResourceLoader {
      fetch(url: string, options: any) {
        if (url.endsWith('.css') || url.includes('fonts.googleapis.com')) {
          return Promise.resolve(Buffer.from(''))
        }
        return super.fetch(url, options)
      }
    }

    const renderer = new JSDomRenderer({
      renderAfterTime: 2500, // Wait for JS execution
      inject: { __PRERENDER__: true },
      jsdomOptions: {
        resources: 'usable',
        resourceLoader: new SkipStylesheetsResourceLoader(),
      }
    })

    const prerenderer = new Prerenderer({
      staticDir: DIST,
      renderer,
    })

    await prerenderer.initialize()
    const renderedRoutes = await prerenderer.renderRoutes(allRoutes)
    await prerenderer.destroy()

    // Write snapshots
    if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true })

    for (const route of renderedRoutes) {
      const routePath = route.route === '/' ? '/index' : route.route
      // Handle /books/:slug nested routes
      const filePath = path.join(OUTPUT, `${routePath}.html`)

      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, route.html, 'utf-8')
      console.log(`✅ ${route.route} → ${filePath.replace(DIST, '')}`)
    }

    console.log(`\n🎉 Done! ${renderedRoutes.length} snapshots written to dist/_prerendered/`)
  } catch (err) {
    console.error('❌ Prerender run failed (warning only):', err)
  }
}

run().catch(err => {
  console.error('❌ Fatal snapshot error:', err)
  process.exit(0)
})
