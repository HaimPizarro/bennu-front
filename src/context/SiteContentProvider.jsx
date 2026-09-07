import { useEffect, useState } from 'react'
import { SiteContentContext } from './siteContent.js'
import { getContenido } from '../lib/api.js'
import { normalizeContenido } from '../lib/contenidoDefaults.js'
import { applyBrandColors } from '../hooks/useThemeColors.js'

export default function SiteContentProvider({ children }) {
  const [contenido, setContenido] = useState(() => normalizeContenido(null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getContenido()
      .then((fetched) => {
        const normalized = normalizeContenido(fetched)
        if (alive) {
          setContenido(normalized)
          applyBrandColors(normalized?.tema?.colors)
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <SiteContentContext.Provider value={{ contenido, loading }}>
      {children}
    </SiteContentContext.Provider>
  )
}
