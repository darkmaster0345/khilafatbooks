import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_VITE_SUPABASE_PUBLISHABLE_KEY;
const BASE_URL = 'https://khilafatbooks.vercel.app';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase credentials missing. Skipping sitemap generation.');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Slugify function matching src/lib/utils.ts
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

async function generateSitemap() {
  console.log('Generating sitemap...');

  const staticPages = [
    '',
    '/shop',
    '/book-requests',
    '/faq',
    '/shipping-policy',
    '/return-policy',
  ];

  // Fetch product names and updated_at to generate consistent slugs and lastmod
  const { data: products, error } = await supabase
    .from('products')
    .select('name, updated_at')
    .eq('is_hidden', false);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add static pages
  staticPages.forEach((page) => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${BASE_URL}${page}</loc>\n`;
    sitemap += `    <changefreq>${page === '' || page === '/shop' ? 'daily' : 'weekly'}</changefreq>\n`;
    sitemap += `    <priority>${page === '' ? '1.0' : page === '/shop' ? '0.9' : '0.7'}</priority>\n`;
    sitemap += '  </url>\n';
  });

  // Add dynamic product pages using /books/ prefix
  products.forEach((product) => {
    const slug = slugify(product.name);
    const lastmod = product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    sitemap += '  <url>\n';
    sitemap += `    <loc>${BASE_URL}/books/${slug}</loc>\n`;
    sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
    sitemap += '    <changefreq>weekly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>';

  const outputPath = path.resolve(__dirname, '../../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap generated successfully at ${outputPath} with ${products.length} products.`);
}

generateSitemap();
