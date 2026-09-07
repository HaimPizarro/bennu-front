import { createContext, useContext } from 'react'

export const SiteContentContext = createContext({ contenido: null, loading: true })

export function useSiteContent() {
  return useContext(SiteContentContext)
}
