import { useEffect, useState } from 'react'
import { SiteContentContext } from './siteContent.js'
import { getContenido } from '../lib/api.js'
import { normalizeContenido } from '../lib/contenidoDefaults.js'

export default function SiteContentProvider({ children }) {
  const [contenido, setContenido] = useState(() => normalizeContenido(null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getContenido()
      .then((fetched) => {
        if (alive) setContenido(normalizeContenido(fetched))
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
