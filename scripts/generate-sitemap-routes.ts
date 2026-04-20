import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Validate credentials to prevent build crashes in CI when env vars are unpopulated or dummy values
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false
  try {
    new URL(url)
    return url.startsWith('http')
  } catch {
    return false
  }
}

if (!isValidUrl(SUPABASE_URL) || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("YOUR_")) {
  console.error('Supabase credentials missing or invalid. Using empty routes.')
  fs.writeFileSync(path.resolve(__dirname, '../src/sitemap-routes.json'), JSON.stringify([]))
  process.exit(0)
}

const supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY)

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

async function generateRoutes() {
  console.log('Fetching dynamic routes from Supabase...')

  const routes: string[] = []

  // Fetch products
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('name')
    .eq('is_hidden', false)

  if (pError) {
    console.error('Error fetching products:', pError)
  } else if (products) {
    products.forEach(p => {
      routes.push(`/books/${slugify(p.name)}`)
    })
  }

  // Fetch unique categories (if applicable, based on product data or separate table)
  // For this project, categories are often dynamic but handled in the Shop page.
  // We can add common category slugs if they exist in the DB.

  console.log(`Generated ${routes.length} dynamic routes.`)

  const outputPath = path.resolve(__dirname, '../src/sitemap-routes.json')
  fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2))
}

generateRoutes()
