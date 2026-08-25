import Reveal from '../components/Reveal.jsx'

const RESULTS = [
  {
    client: 'Florencia D.',
    treatment: 'Limpieza facial profunda',
    metric: 'Piel visiblemente más luminosa',
    detail: 'Eliminó impurezas acumuladas y recuperó el brillo natural en una sola sesión.',
  },
  {
    client: 'María S.',
    treatment: 'Micropunción facial',
    metric: 'Firmeza y textura renovadas',
    detail: 'Serie de tres sesiones para atenuar marcas y redefinir el óvalo facial.',
  },
  {
    client: 'Lucía P.',
    treatment: 'Tratamiento anti-acné',
    metric: 'Control de brotes en 6 semanas',
    detail: 'Protocolo mensual que redujo la inflamación y reguló el exceso de sebo.',
  },
  {
    client: 'Andrea V.',
    treatment: 'Hidratación hialurónica',
    metric: 'Hidratación profunda sostenida',
    detail: 'Recuperó elasticidad y suavidad tras una rutina muy deshidratante.',
  },
]

export default function Results() {
  return (
    <section id="resultados" className="section section--alt">
      <div className="container">
        <Reveal>
          <p className="eyebrow">Resultados</p>
          <h2 className="section__title">Lo que cuentan nuestras clientas</h2>
          <p className="section__lead">
            Resultados medibles, piel a piel. Esto es lo que eligen quienes ya pasaron por Bennu.
          </p>
        </Reveal>
        <Reveal delay={150} as="ul" className="results">
          {RESULTS.map((r, i) => (
            <Reveal as="li" key={r.client} className="result" delay={200 + i * 90}>
              <p className="result__metric">{r.metric}</p>
              <p className="result__detail">{r.detail}</p>
              <div className="result__foot">
                <span className="result__client">{r.client}</span>
                <span className="result__treatment">{r.treatment}</span>
              </div>
            </Reveal>
          ))}
        </Reveal>
      </div>
    </section>
  )
}