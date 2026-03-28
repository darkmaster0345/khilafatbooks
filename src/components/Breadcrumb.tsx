import { Link } from 'react-router-dom'
import { breadcrumbSchema } from '@/lib/seo-schemas'
import { SEOHead } from '@/components/SEOHead'

interface Crumb {
  label: string
  href: string
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const schemaData = breadcrumbSchema(crumbs.map(c => ({ name: c.label, url: c.href })))

  return (
    <>
      <SEOHead jsonLd={schemaData} title="" description="" />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
        <ol className="flex items-center gap-2">
          {crumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {i < crumbs.length - 1 ? (
                <>
                  <Link to={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                  <span aria-hidden="true" className="text-muted-foreground/50">/</span>
                </>
              ) : (
                <span aria-current="page" className="text-foreground font-medium truncate max-w-[200px]">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
