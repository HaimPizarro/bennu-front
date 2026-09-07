import { Link } from 'react-router-dom'
import { useSiteContent } from '../context/siteContent.js'

const NAV_ITEMS = [
  { label: 'Servicios', hash: '#servicios' },
  { label: 'Sobre mí', hash: '#sobre-mi' },
  { label: 'Resultados', hash: '#resultados' },
  { label: 'Contacto', hash: '#contacto' },
]

export default function Footer() {
  const { contenido } = useSiteContent()
  const marca = contenido.marca || {}
  const items = Array.isArray(contenido.contacto?.items) ? contenido.contacto.items : []
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Link className="site-footer__logo" to="/#inicio">
            {marca.nombre || 'bennu'}
          </Link>
          <p className="site-footer__tagline">
            {marca.eslogan || ''} — {marca.descripcion || ''}
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="Navegación del pie">
          <p className="site-footer__heading">Navegación</p>
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.hash}>
                <Link to={`/${item.hash}`}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__contact">
          <p className="site-footer__heading">Contacto</p>
          <ul>
            {items.map((item, i) => (
              <li key={i}>
                <span className="site-footer__label">{item.etiqueta}:</span> {item.valor}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container site-footer__legal">
        © {year} {marca.nombre || 'bennu'} · Estudio de cosmetología
      </div>
    </footer>
  )
}
