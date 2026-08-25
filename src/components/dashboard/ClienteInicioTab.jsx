import { useEffect, useState } from 'react'
import { listUserAppointments } from '../../lib/api.js'
import { formatDate } from '../../lib/date.js'
import AddToCalendarButton from '../AddToCalendarButton.jsx'

export default function ClienteInicioTab({ perfil }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(Boolean(perfil?.id))

  useEffect(() => {
    let alive = true
    listUserAppointments().then((list) => {
      if (!alive) return
      setAppointments(list)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const todayISO = new Date().toISOString().slice(0, 10)
  const upcoming = appointments
    .filter((a) => a.date >= todayISO && a.status !== 'Cancelada')
    .toSorted((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Hola, {perfil?.nombre?.split(' ')[0] || 'cliente'}</h1>
        <div className="dash__head-stats">
          <span className="chip">{perfil?.puntos_acumulados || 0} puntos</span>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel__title">Próximos servicios</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : upcoming.length === 0 ? (
          <p className="muted">No tienes turnos próximos. Reserva uno en la pestaña Agenda.</p>
        ) : (
          <ul className="dash-list">
            {upcoming.map((a) => (
              <li key={a.id} className="dash-row">
                <div className="dash-row__main">
                  <span className="dash-row__name">{a.service?.name || 'Servicio'}</span>
                  <span className="dash-row__meta">
                    {formatDate(a.date)} · {a.time} hs · {a.status}
                  </span>
                </div>
                <div className="dash-row__actions">
                  <AddToCalendarButton
                    title={`${a.service?.name || 'Servicio'} — ${perfil?.nombre || 'Cliente'}`}
                    startDate={a.date}
                    startTime={a.time}
                    durationMin={a.service?.duration || 60}
                    details={`${perfil?.nombre || 'Cliente'}${a.clientEmail ? ` · ${a.clientEmail}` : ''}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
