import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMembresias,
  getMiSuscripcion,
  crearPagoSuscripcion,
  listServices,
} from '../../lib/api.js'
import { formatCurrency } from '../../lib/data.js'
import { formatDate } from '../../lib/date.js'
import { toast } from '../../lib/toast.js'

export default function MembresiaTab({ perfil }) {
  const navigate = useNavigate()
  const [planes, setPlanes] = useState([])
  const [suscripcion, setSuscripcion] = useState(null)
  const [beneficios, setBeneficios] = useState([])
  const [activa, setActiva] = useState(Boolean(perfil?.suscripcion_activa))
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(null)

  useEffect(() => {
    let alive = true
    const ahora = Date.now()
    Promise.all([getMembresias(), getMiSuscripcion(), listServices()]).then(([pl, s, sv]) => {
      if (!alive) return
      setPlanes(Array.isArray(pl) ? pl.filter(Boolean) : [])
      setSuscripcion(s)
      setActiva(
        Boolean(perfil?.suscripcion_activa) ||
          Boolean(
            s && s.estado === 'aprobada' && new Date(s.valida_hasta).getTime() > ahora,
          ),
      )
      setBeneficios(
        (Array.isArray(sv) ? sv : [])
          .filter((x) => x.active && Number(x.descuento_suscripcion) > 0)
          .map((x) => ({
            name: x.name,
            descuento: Number(x.descuento_suscripcion),
          })),
      )
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [perfil])

  const planActualId = suscripcion?.plan_id ?? perfil?.suscripcion_plan_id ?? null
  const planActualNombre = suscripcion?.plan_nombre ?? perfil?.suscripcion_plan_nombre ?? null
  const validaHasta = perfil?.suscripcion_valida_hasta || suscripcion?.valida_hasta || null
  const puntosActual = Number(planes.find((p) => p.id === planActualId)?.puntos_mes) || 0

  const pay = async (planId) => {
    setPaying(planId)
    try {
      const pago = await crearPagoSuscripcion(planId)
      navigate(`/pago/membresia/${pago.id}`)
    } catch (err) {
      toast.error(err.message || 'Error al iniciar el pago de la membresía')
    } finally {
      setPaying(null)
    }
  }

  if (loading) {
    return (
      <>
        <div className="dash__head">
          <h1 className="dash__title">Membresía</h1>
        </div>
        <section className="panel">
          <p className="muted">Cargando…</p>
        </section>
      </>
    )
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Membresía</h1>
        <div className="dash__head-stats">
          <span className={`chip ${activa ? 'chip--ok' : ''}`}>
            {activa ? 'Activa' : 'No activa'}
          </span>
        </div>
      </div>

      {activa ? (
        <section className="panel">
          <h2 className="panel__title">
            Tu membresía está activa{planActualNombre ? ` · ${planActualNombre}` : ''}
          </h2>
          <p className="panel__hint">
            {validaHasta
              ? `Vigente hasta el ${formatDate(String(validaHasta).slice(0, 10))}.`
              : 'Vigente por 30 días desde el último pago.'}
          </p>
          <p className="panel__hint">
            Con tu membresía activa pagas con descuento los servicios del estudio y acumulas{' '}
            {puntosActual > 0 ? `${puntosActual} pts` : 'puntos'} al mes.
          </p>
          {puntosActual > 0 && (
            <p className="panel__hint">
              <strong>+{puntosActual} pts</strong> al pagar la membresía (y cada mes que la renovás).
            </p>
          )}
          <div className="modal__actions">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => planActualId && pay(planActualId)}
              disabled={!planActualId || paying != null}
            >
              {paying === planActualId ? 'Preparando pago…' : 'Renovar membresía'}
            </button>
          </div>
        </section>
      ) : (
        <>
          {planes.length === 0 ? (
            <section className="panel">
              <h2 className="panel__title">Membresía no disponible</h2>
              <p className="panel__hint">
                Todavía no habilitamos la membresía. Vuelve a consultar en unos días.
              </p>
            </section>
          ) : (
            <section className="panel">
              <h2 className="panel__title">Elige tu membresía mensual</h2>
              <p className="panel__hint">
                Paga una vez al mes, aplica descuentos en tus servicios y suma puntos de
                fidelización. Puedes tener una sola suscripción a la vez.
              </p>
              <div className="planes-grid">
                {planes.map((p) => (
                  <article key={p.id} className="plan-card">
                    <h3 className="plan-card__nombre">{p.nombre || `Plan ${p.id}`}</h3>
                    {p.descripcion && <p className="plan-card__descripcion">{p.descripcion}</p>}
                    <p className="membresia-precio">
                      {formatCurrency(p.precio_mensual)}
                      <span className="membresia-precio__periodo">/ mes</span>
                    </p>
                    {Number(p.puntos_mes) > 0 && (
                      <p className="panel__hint">Al activarla sumas +{p.puntos_mes} pts.</p>
                    )}
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => pay(p.id)}
                      disabled={paying != null}
                    >
                      {paying === p.id
                        ? 'Preparando pago…'
                        : `Suscribirme ${formatCurrency(p.precio_mensual)}`}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {beneficios.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">Descuentos para suscriptores</h2>
          <ul className="membresia-beneficios">
            {beneficios.map((b) => (
              <li key={b.name} className="membresia-beneficio">
                <span>{b.name}</span>
                <span className="chip chip--steel">-{b.descuento}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}