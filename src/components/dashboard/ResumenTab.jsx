import { formatCurrency } from '../../lib/data.js'
import { formatDate, getTodayISO, toISODate } from '../../lib/date.js'
import { Donut, Bars, Line } from '../../components/Charts.jsx'

const CONFIRMED = ['Confirmada', 'Completada']

// Precio efectivo de una cita (oferta si existe).
const effectivePrice = (a, serviceById) => {
  const s = serviceById.get(a.serviceId) || a.service
  return s ? Number(s.precio_oferta ?? s.price) || 0 : 0
}

const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// Timestamp de fin de día para una fecha ISO (comparación de vigencia).
const vigenciaTs = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T23:59:59').getTime() : 0)

export default function ResumenTab({ appointments, services, serviceById, clients, suscripciones }) {
  const today = getTodayISO()
  const monthPrefix = today.slice(0, 7)

  const subs = (Array.isArray(suscripciones) ? suscripciones : []).filter(Boolean)
  const finHoy = vigenciaTs(today)
  const activas = subs.filter((s) => s.estado === 'aprobada' && vigenciaTs(s.valida_hasta) >= finHoy)
  const activasSort = activas.toSorted((a, b) => vigenciaTs(a.valida_hasta) - vigenciaTs(b.valida_hasta))
  const vencenPronto = activasSort.filter((s) => vigenciaTs(s.valida_hasta) <= vigenciaTs(toISODate(addDays(new Date(), 7))))
  const ingresosMembresias = activas.reduce((acc, s) => acc + (Number(s.monto) || 0), 0)

  const safeList = (Array.isArray(appointments) ? appointments : []).filter(Boolean)

  const totalCitas = safeList.filter((a) => (a.date || '').startsWith(monthPrefix)).length
  const paid = safeList.filter((a) => CONFIRMED.includes(a.status))
  const ingresos = paid.reduce((acc, a) => acc + effectivePrice(a, serviceById), 0)

  const status = [
    { label: 'Confirmadas', value: safeList.filter((a) => a.status === 'Confirmada').length, color: 'var(--steel)' },
    { label: 'Pendientes', value: safeList.filter((a) => a.status === 'Pendiente').length, color: 'var(--mist)' },
    { label: 'Canceladas', value: safeList.filter((a) => a.status === 'Cancelada').length, color: '#b4553f' },
  ]

  const upcoming = safeList
    .filter((a) => a.status !== 'Cancelada' && a.date >= today)
    .toSorted((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 5)

  const counts = new Map()
  services.forEach((s) => counts.set(s.id, 0))
  safeList.forEach((a) => {
    if (counts.has(a.serviceId)) counts.set(a.serviceId, counts.get(a.serviceId) + 1)
  })
  const popular = [...counts.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, value]) => ({ label: serviceById.get(id)?.name || '—', value }))
    .filter((p) => p.value > 0)

  // Ingresos de los últimos 7 días (confirmadas + completadas).
  const revenueByDay = new Map()
  for (let i = 6; i >= 0; i--) {
    revenueByDay.set(toISODate(addDays(new Date(), -i)), 0)
  }
  paid.forEach((a) => {
    if (a.date && revenueByDay.has(a.date)) {
      revenueByDay.set(a.date, revenueByDay.get(a.date) + effectivePrice(a, serviceById))
    }
  })
  const revenueWeek = [...revenueByDay.values()]

  const cards = [
    { label: 'Citas del mes', value: totalCitas, suffix: '' },
    { label: 'Ingresos', value: formatCurrency(ingresos), suffix: '' },
    { label: 'Clientes', value: clients.length, suffix: '' },
    { label: 'Servicios', value: services.length, suffix: '' },
    { label: 'Suscriptores activos', value: activas.length, suffix: '' },
    { label: 'Membresías/mes', value: formatCurrency(ingresosMembresias), suffix: '' },
  ]

  return (
    <>
      <div className="dash__cards">
        {cards.map((c) => (
          <div className="dash__card" key={c.label}>
            <span className="dash__card-label">{c.label}</span>
            <span className="dash__card-value">
              {c.value}
              {c.suffix}
            </span>
          </div>
        ))}
      </div>

      <div className="dash__grid">
        <section className="panel">
          <h2 className="panel__title">Estado de citas</h2>
          <Donut data={status} />
        </section>

        <section className="panel">
          <h2 className="panel__title">Próximas citas</h2>
          {upcoming.length === 0 ? (
            <p className="muted">No hay citas próximas.</p>
          ) : (
            <ul className="panel__list">
              {upcoming.map((a) => {
                const s = serviceById.get(a.serviceId) || a.service
                return (
                  <li key={a.id} className="panel__item">
                    <span className="panel__item-dot" aria-hidden="true" />
                    <div>
                      <strong>{s?.name || 'Servicio eliminado'}</strong>
                      <span className="panel__item-meta">
                        {a.clientName || 'Walk-in'} · {formatDate(a.date)} {a.time} hs
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="panel__title">Servicios más populares</h2>
          {popular.length === 0 ? (
            <p className="muted">Sin reservas todavía.</p>
          ) : (
            <Bars data={popular} />
          )}
        </section>

        <section className="panel">
          <h2 className="panel__title">Ingresos de la semana</h2>
          <div className="panel__chart-wrap">
            <Line points={revenueWeek} />
          </div>
          <p className="muted panel__hint">Últimos 7 días · citas confirmadas y completadas.</p>
        </section>

        <section className="panel">
          <h2 className="panel__title">Suscriptores activos</h2>
          {activasSort.length === 0 ? (
            <p className="muted">Sin suscriptores activos.</p>
          ) : (
            <ul className="panel__list">
              {activasSort.map((s) => (
                <li key={s.id} className="panel__item">
                  <span className="panel__item-dot" aria-hidden="true" />
                  <div>
                    <strong>{s.usuario || '—'}</strong>
                    <span className="panel__item-meta">
                      {s.plan_nombre || 'Membresía'} · {formatCurrency(s.monto)}/mes · vence{' '}
                      {formatDate(String(s.valida_hasta).slice(0, 10))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="panel__title">Vencen en 7 días</h2>
          {vencenPronto.length === 0 ? (
            <p className="muted">Ninguna membresía vence la próxima semana.</p>
          ) : (
            <ul className="panel__list">
              {vencenPronto.map((s) => (
                <li key={s.id} className="panel__item">
                  <span className="panel__item-dot" aria-hidden="true" />
                  <div>
                    <strong>{s.usuario || '—'}</strong>
                    <span className="panel__item-meta">
                      {formatDate(String(s.valida_hasta).slice(0, 10))} · renovar para no perder el descuento
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
