import Reveal from '../components/Reveal.jsx'
import MediaSlider from '../components/MediaSlider.jsx'
import { useSiteContent } from '../context/siteContent.js'

export default function Results() {
  const { contenido } = useSiteContent()
  const resultados = contenido.resultados || {}
  const modo = resultados.modo || 'texto'
  const items = Array.isArray(resultados.items) ? resultados.items : []

  const withImages = items.filter((r) => r.imagen?.url)
  const slides = withImages.map((r) => ({
    url: r.imagen.url,
    alt: r.imagen.alt || `${r.cliente} — ${r.tratamiento}`,
    caption: `${r.cliente} · ${r.tratamiento}`,
  }))
  const showCards = modo !== 'imagenes' && items.some((r) => r.metrica || r.detalle)
  const showGallery = modo !== 'texto' && slides.length > 0

  return (
    <section id="resultados" className="section section--alt">
      <div className="container">
        <Reveal>
          <p className="eyebrow">{resultados.eyebrow}</p>
          <h2 className="section__title">{resultados.titulo}</h2>
          {resultados.lead && <p className="section__lead">{resultados.lead}</p>}
        </Reveal>

        {showGallery && (
          <Reveal delay={120}>
            <MediaSlider
              slides={slides}
              aspect="wide"
              autoplay={5000}
              caption
              className="results-slider"
            />
          </Reveal>
        )}

        {showCards && (
          <Reveal delay={showGallery ? 180 : 120} as="ul" className="results">
            {items.map((r, i) => (
              <Reveal as="li" key={r.cliente || i} className="result" delay={200 + i * 90}>
                {r.imagen?.url && modo === 'ambos' && (
                  <img className="result__img" src={r.imagen.url} alt={r.imagen.alt || ''} loading="lazy" />
                )}
                {r.metrica && <p className="result__metric">{r.metrica}</p>}
                {r.detalle && <p className="result__detail">{r.detalle}</p>}
                {(r.cliente || r.tratamiento) && (
                  <div className="result__foot">
                    <span className="result__client">{r.cliente}</span>
                    <span className="result__treatment">{r.tratamiento}</span>
                  </div>
                )}
              </Reveal>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  )
}
