import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useSessionAuth from './hooks/useSessionAuth.js'

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', to: '/', hash: '#inicio' },
  { id: 'servicios', label: 'Servicios', to: '/', hash: '#servicios' },
  { id: 'sobre-mi', label: 'Sobre Mi', to: '/', hash: '#sobre-mi' },
  { id: 'resultados', label: 'Resultados', to: '/', hash: '#resultados' },
  { id: 'agenda', label: 'Agenda', to: '/agenda', hash: '' },
  { id: 'contacto', label: 'Contacto', to: '/', hash: '#contacto' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const { session, loading } = useSessionAuth()

  const isActive = (item) => {
    if (item.to === '/agenda') return pathname === '/agenda'
    if (pathname !== '/') return false
    if (!hash || hash === '#inicio') return item.id === 'inicio'
    return hash === item.hash
  }

  const cta = loading ? (
    <span className="site-header__cta site-header__cta--ghost" aria-hidden="true" />
  ) : !session ? (
    <Link className="site-header__cta" to="/login" onClick={() => setOpen(false)}>
      Iniciar sesión
    </Link>
  ) : (
    <Link
      className="site-header__cta"
      to={Number(session?.perfil?.rol) === 0 ? '/dashboard' : '/mi-cuenta'}
      onClick={() => setOpen(false)}
    >
      Mi Cuenta
    </Link>
  )

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" to="/#inicio">
          bennu
        </Link>

        <nav className={open ? 'site-header__nav is-open' : 'site-header__nav'} aria-label="Navegación principal">
          <ul className="site-header__list">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  className={isActive(item) ? 'site-header__link is-active' : 'site-header__link'}
                  to={item.to + item.hash}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="site-header__menu-cta">{cta}</li>
          </ul>
        </nav>

        {cta}

        <button
          className="site-header__toggle"
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
    </header>
  )
}

export default Header