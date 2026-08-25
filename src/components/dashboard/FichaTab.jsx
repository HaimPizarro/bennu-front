import { useEffect, useState } from 'react'
import { getFicha } from '../../lib/api.js'
import { FICHA_SECTIONS, FICHA_CONSENT_TEXT, FICHA_FOTOS_TEXT } from '../../lib/ficha.js'
import { formatDate } from '../../lib/date.js'

const hasValue = (v) => typeof v === 'string' && v.trim() !== ''

export default function FichaTab({ perfil }) {
  const [ficha, setFicha] = useState(null)
  const [loading, setLoading] = useState(Boolean(perfil?.id))

  useEffect(() => {
    if (!perfil?.id) return
    let alive = true
    getFicha(perfil.id)
      .then((f) => {
        if (!alive) return
        setFicha(f)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setFicha(null)
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [perfil?.id])

  const content = ficha?.content || {}
  const sesiones = Array.isArray(content.sesiones) ? content.sesiones : []

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Ficha clínica</h1>
        {ficha?.updatedAt && (
          <span className="chip chip--steel">Actualizada {formatDate(ficha.updatedAt.slice(0, 10))}</span>
        )}
      </div>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : !ficha ? (
        <section className="panel">
          <p className="muted">Aún no tienes ficha clínica.</p>
          <p className="muted">La completa el equipo de bennu en tu próxima visita.</p>
        </section>
      ) : (
        <>
          {FICHA_SECTIONS.map((section) => {
            const values = content[section.key] || {}
            const present = section.fields.filter((f) => hasValue(values[f.key]))
            const mapa = section.hasMapaFacial ? values.mapa_facial : null
            if (present.length === 0 && !mapa) return null
            return (
              <section key={section.key} className="panel">
                <h2 className="panel__title">{section.title}</h2>
                <dl className="ficha-dl">
                  {present.map((f) => (
                    <div key={f.key} className="ficha-dl__row">
                      <dt>{f.label}</dt>
                      <dd>{values[f.key]}</dd>
                    </div>
                  ))}
                </dl>
                {mapa && (
                  <figure className="ficha-img">
                    <img src={mapa} alt="Mapa facial" />
                    <figcaption>Mapa facial</figcaption>
                  </figure>
                )}
              </section>
            )
          })}

          {sesiones.length > 0 && (
            <section className="panel">
              <h2 className="panel__title">Protocolo y evolución del tratamiento</h2>
              <div className="ficha-sesiones">
                {sesiones
                  .toSorted((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
                  .map((s, i) => (
                    <article key={`${s.fecha}-${i}`} className="ficha-sesion">
                      <h3 className="ficha-sesion__fecha">{formatDate(s.fecha)}</h3>
                      <dl className="ficha-dl">
                        {hasValue(s.tratamiento) && (
                          <div className="ficha-dl__row">
                            <dt>Tratamiento</dt>
                            <dd>{s.tratamiento}</dd>
                          </div>
                        )}
                        {hasValue(s.aparatologia) && (
                          <div className="ficha-dl__row">
                            <dt>Aparatología</dt>
                            <dd>{s.aparatologia}</dd>
                          </div>
                        )}
                        {hasValue(s.principios_activos) && (
                          <div className="ficha-dl__row">
                            <dt>Principios activos</dt>
                            <dd>{s.principios_activos}</dd>
                          </div>
                        )}
                        {hasValue(s.observaciones) && (
                          <div className="ficha-dl__row">
                            <dt>Observaciones</dt>
                            <dd>{s.observaciones}</dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  ))}
              </div>
            </section>
          )}

          <section className="panel">
            <h2 className="panel__title">Consentimiento informado</h2>
            <ul className="ficha-consent">
              <li className={content.consentimiento?.aceptado ? 'is-yes' : ''}>
                {content.consentimiento?.aceptado ? '✓' : '✗'} {FICHA_CONSENT_TEXT}
              </li>
              <li className={content.consentimiento?.autoriza_fotos ? 'is-yes' : ''}>
                {content.consentimiento?.autoriza_fotos ? '✓' : '✗'} {FICHA_FOTOS_TEXT}
              </li>
            </ul>
            {content.consentimiento?.firma && (
              <figure className="ficha-img ficha-img--firma">
                <img src={content.consentimiento.firma} alt="Firma de consentimiento" />
                <figcaption>
                  Firma{content.consentimiento?.fecha ? ` · ${formatDate(content.consentimiento.fecha)}` : ''}
                </figcaption>
              </figure>
            )}
            {hasValue(content.consentimiento?.observaciones) && (
              <p className="muted">{content.consentimiento.observaciones}</p>
            )}
          </section>
        </>
      )}
    </>
  )
}