// Aplicación dinámica de metadatos SEO sobre el <head>. Como es una SPA, el
// título/descripción/keywords/OG se actualizan en runtime (Google indexa el
// HTML renderizado) y los defaults quedan en index.html como respaldo.

const upsertMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  if (content) el.setAttribute('content', content)
  else el.remove()
}

const upsertLink = (rel, href) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  if (href) el.setAttribute('href', href)
}

const upsertJsonLd = (payload) => {
  const id = 'bennu-jsonld'
  document.getElementById(id)?.remove()
  if (!payload) return
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = id
  script.textContent = JSON.stringify(payload)
  document.head.appendChild(script)
}

export function seoImageUrl(seo) {
  const img = seo?.og_imagen
  if (!img) return ''
  if (typeof img === 'string') return img
  return img.url || ''
}

// Convierte los ítems de contacto del CMS en el esquema LocalBusiness
// (HealthAndBeautyBusiness) para mejorar la visibilidad local en Google.
export function buildLocalBusinessJsonLd(contenido) {
  const marca = contenido?.marca || {}
  const seo = contenido?.seo || {}
  const items = contenido?.contacto?.items || []
  const byTipo = (tipo) => items.find((i) => i.tipo === tipo)?.valor || ''
  const ogImagen = seoImageUrl(seo)
  const address = byTipo('direccion')
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: marca.nombre || 'bennu',
    description: seo.descripcion || marca.descripcion || '',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    ...(byTipo('telefono') ? { telephone: byTipo('telefono') } : {}),
    ...(byTipo('email') ? { email: byTipo('email') } : {}),
    ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address } } : {}),
    ...(ogImagen ? { image: ogImagen } : {}),
  }
}

export function applySiteSeo({ title, description, keywords, ogImage, jsonLd }) {
  if (typeof document === 'undefined') return
  document.title = title || 'bennu'
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:type', 'website')
  if (ogImage) {
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', ogImage)
  }
  if (typeof window !== 'undefined') upsertLink('canonical', window.location.href.split('?')[0])
  upsertJsonLd(jsonLd)
}

export const ROUTE_SEO = {
  '/agenda': { titleSuffix: 'Agenda', descripcionSuffix: 'Reserva tu turno online en bennu.' },
  '/login': { titleSuffix: 'Ingresar', descripcionSuffix: 'Acceso al panel de bennu.' },
  '/dashboard': { titleSuffix: 'Panel', descripcionSuffix: 'Administración del estudio bennu.' },
  '/mi-cuenta': { titleSuffix: 'Mi cuenta', descripcionSuffix: 'Tu cuenta en bennu.' },
}
