import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Barrido prismático en cada cambio de ruta (firma visual de bennu).
export default function PageTransition() {
  const { pathname } = useLocation()
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('is-active')
    // fuerza reflow para reiniciar la animación CSS
    void el.offsetWidth
    el.classList.add('is-active')
    const t = setTimeout(() => el.classList.remove('is-active'), 550)
    return () => clearTimeout(t)
  }, [pathname])

  return <div ref={ref} className="prisma-overlay" aria-hidden="true" />
}
