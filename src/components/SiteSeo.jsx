import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteContent } from '../context/siteContent.js'
import { applySiteSeo, buildLocalBusinessJsonLd, ROUTE_SEO, seoImageUrl } from '../lib/seo.js'

// Aplica título/descripción/keywords/OG/JSON-LD del CMS según la ruta activa.
// En la landing usa el SEO configurado; en las demás rutas usa un sufijo.
export default function SiteSeo() {
  const { contenido } = useSiteContent()
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = contenido?.seo || {}
    const marca = contenido?.marca?.nombre || 'bennu'
    const route = ROUTE_SEO[pathname]

    let title = seo.titulo || `${marca} — Estudio de cosmetología`
    let description = seo.descripcion || ''
    if (route) {
      title = `${route.titleSuffix} · ${marca}`
      description = description || route.descripcionSuffix
    }

    applySiteSeo({
      title,
      description,
      keywords: seo.keywords || [],
      ogImage: seoImageUrl(seo),
      jsonLd: pathname === '/' ? buildLocalBusinessJsonLd(contenido) : null,
    })
  }, [contenido, pathname])

  return null
}
