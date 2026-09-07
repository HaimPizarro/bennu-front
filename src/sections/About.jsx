import Reveal from '../components/Reveal.jsx'
import { useSiteContent } from '../context/siteContent.js'

export default function About() {
  const { contenido } = useSiteContent()
  const sobreMi = contenido.sobreMi || {}
  const imagen = sobreMi.imagen?.url ? sobreMi.imagen : null

  return (
    <section id="sobre-mi" className="section">
      <div className="container about">
        <Reveal className="about__text">
          <p className="eyebrow">{sobreMi.eyebrow}</p>
          <h2 className="section__title">{sobreMi.titulo}</h2>
          {Array.isArray(sobreMi.parrafos) &&
            sobreMi.parrafos.map((parrafo, i) => (
              <p className="about__p" key={i}>
                {parrafo}
              </p>
            ))}
          {Array.isArray(sobreMi.credenciales) && sobreMi.credenciales.length > 0 && (
            <ul className="about__creds">
              {sobreMi.credenciales.map((credencial, i) => (
                <li key={i}>{credencial}</li>
              ))}
            </ul>
          )}
        </Reveal>
        <Reveal delay={150} className="about__visual" aria-hidden="true">
          {imagen ? (
            <img className="about__img" src={imagen.url} alt={imagen.alt || ''} loading="lazy" />
          ) : (
            <>
              <span className="about__monogram">B</span>
              <span className="about__caption">bennu · estudio de cosmética</span>
            </>
          )}
        </Reveal>
      </div>
    </section>
  )
}
