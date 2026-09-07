import { useState } from 'react'

// Filtra una lista por coincidencia (insensible a mayúsculas) sobre los campos
// indicados, mientras se escribe. Devuelve query, setQuery y la lista filtrada.
export default function useSearch(items, keys = []) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = q
    ? (Array.isArray(items) ? items : [])
        .filter(Boolean)
        .filter((item) =>
          keys.some((key) => {
            const value = item?.[key]
            return value != null && String(value).toLowerCase().includes(q)
          }),
        )
    : Array.isArray(items)
      ? items.filter(Boolean)
      : []

  return { query, setQuery, filtered, hasQuery: Boolean(q) }
}
