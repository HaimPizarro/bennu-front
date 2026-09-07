import { Link } from 'react-router-dom'
import { useSiteContent } from '../context/siteContent.js'
import MediaSlider from '../components/MediaSlider.jsx'

// Los destinos pueden ser rutas internas (/agenda) o anclas (#servicios).
function CtaLink({ cta, className }) {
  if (!cta?.destino) return null
  const internal = cta.destino.startsWith('/')
  const content = cta.texto || cta.destino
  return internal ? (
    <Link className={className} to={cta.destino}>
      {content}
    </Link>
  ) : (
    <a className={className} href={cta.destino}>
      {content}
    </a>
  )
}

export default function Hero() {
  const { contenido } = useSiteContent()
  const hero = contenido.hero || {}
  const hasTitleDot = !/([.!?])\s*$/.test(hero.titulo || '')
  const imagenes = (Array.isArray(hero.imagenes) ? hero.imagenes : []).filter((img) => img && img.url)

  return (
    <section id="inicio" className="hero">
      <div className="container">
        {hero.eyebrow && (
          <p className="hero-anim eyebrow" style={{ animationDelay: '0ms' }}>
            {hero.eyebrow}
          </p>
        )}
        <h1 className="hero-anim hero__title" style={{ animationDelay: '120ms' }}>
          {hero.titulo}
          {hasTitleDot && <span className="hero__dot">.</span>}
        </h1>
        {hero.lead && (
          <p className="hero-anim hero__lead" style={{ animationDelay: '240ms' }}>
            {hero.lead}
          </p>
        )}
        <div className="hero-anim hero__actions" style={{ animationDelay: '360ms' }}>
          {hero.cta_primario?.destino && (
            <CtaLink cta={hero.cta_primario} className="btn btn--primary" />
          )}
          {hero.cta_secundario?.destino && (
            <CtaLink cta={hero.cta_secundario} className="btn btn--ghost" />
          )}
        </div>

        {imagenes.length > 0 && (
          <div className="hero-anim hero-media" style={{ animationDelay: '440ms' }}>
            <MediaSlider
              slides={imagenes.map((img) => ({ url: img.url, alt: img.alt }))}
              aspect="wide"
              autoplay={6000}
            />
          </div>
        )}

        {Array.isArray(hero.stats) && hero.stats.length > 0 && (
          <dl className="hero-anim hero__stats" style={{ animationDelay: '520ms' }}>
            {hero.stats.map((stat, i) => (
              <div className="hero__stat" key={stat.etiqueta || i}>
                <dt className="hero__stat-value">{stat.valor}</dt>
                <dd className="hero__stat-label">{stat.etiqueta}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
