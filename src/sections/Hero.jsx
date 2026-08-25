import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="container">
        <p className="hero-anim eyebrow" style={{ animationDelay: '0ms' }}>
          Estudio de cosmética · Bennu
        </p>
        <h1 className="hero-anim hero__title" style={{ animationDelay: '120ms' }}>
          Renacé en tu piel<span className="hero__dot">.</span>
        </h1>
        <p className="hero-anim hero__lead" style={{ animationDelay: '240ms' }}>
          Tratamientos faciales y corporales con protocolos precisos y productos
          premium, pensados para que tu piel luzca su mejor versión.
        </p>
        <div className="hero-anim hero__actions" style={{ animationDelay: '360ms' }}>
          <Link className="btn btn--primary" to="/agenda">
            Reservar turno
          </Link>
          <a className="btn btn--ghost" href="#servicios">
            Ver servicios
          </a>
        </div>
        <dl className="hero-anim hero__stats" style={{ animationDelay: '480ms' }}>
          <div className="hero__stat">
            <dt className="hero__stat-value">12+</dt>
            <dd className="hero__stat-label">años de experiencia</dd>
          </div>
          <div className="hero__stat">
            <dt className="hero__stat-value">3000+</dt>
            <dd className="hero__stat-label">sesiones realizadas</dd>
          </div>
          <div className="hero__stat">
            <dt className="hero__stat-value">98%</dt>
            <dd className="hero__stat-label">clientas que recomiendan</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}