import { useState, useEffect } from 'react'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { formatCurrency } from '../../lib/data.js'
import { listAvailability } from '../../lib/api.js'
import { getMonthGrid, WEEKDAYS, formatDate, getTodayISO } from '../../lib/date.js'
import CalendarNav from '../CalendarNav.jsx'

const ESTADOS = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada']

const emptyDraft = () => ({
  clientId: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  serviceId: '',
  date: getTodayISO(),
  time: '',
  status: 'Pendiente',
  notes: '',
  recurrencia: 'none',
  recurrencia_hasta: '',
})

const safeList = (apps) => (Array.isArray(apps) ? apps : []).filter(Boolean)

export default function AgendaTab({
  appointments,
  services,
  serviceById,
  registryClients,
  onSaveAppointment,
  onDeleteAppointment,
  onStatus,
  onCreateRecurring,
  onCancelSeries,
  onDeleteSeries,
}) {
  const now = new Date()
  const today = getTodayISO()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(today)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [isNew, setIsNew] = useState(true)
  const [isWalkIn, setIsWalkIn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [seriesTarget, setSeriesTarget] = useState(null)
  const [dayAvailability, setDayAvailability] = useState(null)

  const list = safeList(appointments)

  const countByDate = list.reduce((acc, a) => {
    const d = a.date || ''
    acc[d] = (acc[d] || 0) + 1
    return acc
  }, {})

  const grid = getMonthGrid(year, month)
  const dayAppointments = list
    .filter((a) => a.date === selectedDay)
    .toSorted((a, b) => (a.time || '').localeCompare(b.time || ''))

  // Carga disponibilidad real del día para el selector de hora (intervalos de 5 min).
  useEffect(() => {
    let alive = true
    if (!draft.date) return
    listAvailability(draft.date).then((av) => {
      if (alive) setDayAvailability(av)
    })
    return () => {
      alive = false
    }
  }, [draft.date])

  const availableTimes = dayAvailability
    ? dayAvailability.slots
        .filter((s) => s.available)
        .map((s) => s.time)
        .toSorted()
    : []

  const startNew = () => {
    setDraft({ ...emptyDraft(), date: selectedDay })
    setIsNew(true)
    setIsWalkIn(false)
    setShowForm(true)
  }

  const startEdit = (a) => {
    setDraft({
      clientId: a.userId || '',
      clientName: a.clientName || '',
      clientEmail: a.clientEmail || '',
      clientPhone: a.clientPhone || '',
      serviceId: a.serviceId || '',
      date: a.date || today,
      time: a.time || '',
      status: a.status || 'Pendiente',
      notes: a.notes || '',
      recurrencia: a.recurrencia || 'none',
      recurrencia_hasta: a.recurrencia_hasta || '',
    })
    setIsNew(false)
    setIsWalkIn(!a.userId)
    setEditTarget(a)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setDraft(emptyDraft())
  }

  const submitAppointment = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      id: isNew ? undefined : editTarget.id,
      userId: isWalkIn ? null : draft.clientId || null,
      clientName: isWalkIn ? draft.clientName.trim() : null,
      clientEmail: isWalkIn ? draft.clientEmail.trim() : null,
      clientPhone: isWalkIn ? draft.clientPhone.trim() : null,
      serviceId: draft.serviceId,
      date: draft.date,
      time: draft.time,
      status: draft.status,
      notes: draft.notes.trim(),
      recurrencia: draft.recurrencia,
      recurrencia_hasta: draft.recurrencia_hasta || null,
    }
    if (isNew && payload.recurrencia !== 'none') {
      await onCreateRecurring(payload)
    } else {
      await onSaveAppointment(payload)
    }
    setSaving(false)
    closeForm()
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Agenda</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={startNew}>
          + Nueva cita
        </button>
      </div>

      <div className="calendar-toolbar">
        <CalendarNav
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y)
            setMonth(m)
          }}
          onToday={() => {
            setYear(new Date().getFullYear())
            setMonth(new Date().getMonth())
          }}
        />
      </div>

      <div className="calendar">
        <div className="calendar__weekdays">
          {WEEKDAYS.map((w) => (
            <span key={w} className="calendar__weekday">
              {w}
            </span>
          ))}
        </div>
        <div className="calendar__grid">
          {grid.map((cell) => {
            const count = countByDate[cell.date] || 0
            return (
              <button
                key={cell.date}
                type="button"
                className={[
                  'calendar__day',
                  cell.isCurrentMonth ? '' : 'calendar__day--outside',
                  cell.isPast ? 'calendar__day--past' : '',
                  cell.isToday ? 'calendar__day--today' : '',
                  cell.date === selectedDay ? 'calendar__day--selected' : '',
                ].join(' ')}
                onClick={() => setSelectedDay(cell.date)}
              >
                <span className="calendar__day-num">{cell.dayNum}</span>
                {count > 0 && (
                  <span className={`calendar__dots calendar__dots--count`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <h2 className="dash__subtitle">Citas del {formatDate(selectedDay)}</h2>
      {dayAppointments.length === 0 && <p className="muted">No hay citas para este día.</p>}
      <ul className="dash-list">
        {dayAppointments.map((a) => {
          const service = serviceById.get(a.serviceId) || a.service
          const price = service?.precio_oferta || service?.price
          return (
            <li key={a.id} className="dash-row">
              <div className="dash-row__main">
                <span className="dash-row__name">
                  {a.time} · {a.clientName || 'Walk-in'} · {service?.name || 'Servicio'}
                </span>
                <span className="dash-row__meta">
                  {[a.clientEmail, a.clientPhone, price ? formatCurrency(price) : '']
                    .filter(Boolean)
                    .join(' · ')}
                  {a.puntos_abonados ? ' · +pts' : ''}
                </span>
                {a.respuestas && Object.keys(a.respuestas).length > 0 && (
                  <span className="dash-row__meta">
                    {Object.entries(a.respuestas)
                      .map(([label, value]) => `${label}: ${Array.isArray(value) ? value.join(', ') : value}`)
                      .join(' · ')}
                  </span>
                )}
                {a.recurrencia !== 'none' && (
                  <span className="chip chip--steel">
                    {a.recurrencia === 'daily' ? 'diaria' : a.recurrencia === 'weekly' ? 'semanal' : 'mensual'}
                  </span>
                )}
              </div>
              <div className="dash-row__actions">
                <span className={`chip ${statusChipClass(a.status)}`}>{a.status}</span>
                {a.status === 'Confirmada' && (
                  <button
                    className="btn btn--ghost btn--sm"
                    type="button"
                    onClick={() => setStatusTarget({ ...a, to: 'Completada' })}
                  >
                    Completar
                  </button>
                )}
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => startEdit(a)}>
                  Editar
                </button>
                {a.recurrencia !== 'none' && (
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => setSeriesTarget(a)}>
                    Serie
                  </button>
                )}
                <button
                  className="btn btn--danger btn--sm"
                  type="button"
                  onClick={() => setDeleteTarget(a)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {showForm && (
        <Modal title={isNew ? 'Nueva cita' : 'Editar cita'} onClose={closeForm}>
          <form className="form" onSubmit={submitAppointment}>
            <label className="field">
              <span className="field__label">Cliente</span>
              <select
                className="field__input"
                value={draft.clientId}
                disabled={isWalkIn}
                onChange={(e) => setDraft({ ...draft, clientId: e.target.value })}
                required={!isWalkIn}
              >
                <option value="">Seleccionar cliente</option>
                {registryClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--check">
              <input
                type="checkbox"
                checked={isWalkIn}
                onChange={(e) => setIsWalkIn(e.target.checked)}
              />
              <span className="field__label">Sin cuenta (walk-in)</span>
            </label>

            {isWalkIn && (
              <div className="field-row">
                <label className="field">
                  <span className="field__label">Nombre</span>
                  <input
                    className="field__input"
                    value={draft.clientName}
                    onChange={(e) => setDraft({ ...draft, clientName: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span className="field__label">Teléfono</span>
                  <input
                    className="field__input"
                    value={draft.clientPhone}
                    onChange={(e) => setDraft({ ...draft, clientPhone: e.target.value })}
                  />
                </label>
              </div>
            )}

            {isWalkIn && (
              <label className="field">
                <span className="field__label">Email — opcional</span>
                <input
                  className="field__input"
                  type="email"
                  value={draft.clientEmail}
                  onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })}
                />
              </label>
            )}

            <label className="field">
              <span className="field__label">Servicio</span>
              <select
                className="field__input"
                value={draft.serviceId}
                onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })}
                required
              >
                <option value="">Seleccionar servicio</option>
                {safeList(services)
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {formatCurrency(s.precio_oferta || s.price)}
                    </option>
                  ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Fecha</span>
                <input
                  className="field__input"
                  type="date"
                  value={draft.date}
                  onChange={(e) => {
                    setDayAvailability(null)
                    setDraft({ ...draft, date: e.target.value })
                  }}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Hora</span>
                <select
                  className="field__input"
                  value={draft.time}
                  onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                  required
                >
                  <option value="">
                    {dayAvailability?.closed ? 'Cerrado' : availableTimes.length ? 'Elige horario' : 'Cargando…'}
                  </option>
                  {availableTimes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Estado</span>
                <select
                  className="field__input"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Repetir</span>
                <select
                  className="field__input"
                  value={draft.recurrencia}
                  disabled={!isNew}
                  onChange={(e) => setDraft({ ...draft, recurrencia: e.target.value })}
                >
                  <option value="none">No repetir</option>
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </label>
            </div>

            {draft.recurrencia !== 'none' && (
              <label className="field">
                <span className="field__label">Repetir hasta (fecha final)</span>
                <input
                  className="field__input"
                  type="date"
                  value={draft.recurrencia_hasta}
                  min={draft.date}
                  onChange={(e) => setDraft({ ...draft, recurrencia_hasta: e.target.value })}
                />
                <p className="field__hint">
                  Dejar vacío crea la serie por 12 meses. Cada instancia se valida contra solapamientos antes de guardar.
                </p>
              </label>
            )}

            <label className="field">
              <span className="field__label">Notas</span>
              <textarea
                className="field__input"
                rows="2"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>

            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : isNew ? 'Crear cita' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar cita"
          message={`¿Eliminar la cita de ${deleteTarget.clientName || 'walk-in'} (${deleteTarget.time})?`}
          onConfirm={() => {
            onDeleteAppointment(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          title={`Marcar como ${statusTarget.to}`}
          message={`¿Confirmar "${statusTarget.to}" para ${statusTarget.clientName || 'walk-in'} (${statusTarget.time})?`}
          confirmLabel="Confirmar"
          onConfirm={() => {
            onStatus(statusTarget.id, statusTarget.to)
            setStatusTarget(null)
          }}
          onCancel={() => setStatusTarget(null)}
        />
      )}

      {seriesTarget && (
        <ConfirmDialog
          title="Acciones sobre la serie"
          message={`Esta cita es parte de una serie recurrente. ¿Qué desea hacer?`}
          confirmLabel="Cancelar serie"
          secondaryLabel="Eliminar serie"
          onConfirm={() => {
            onCancelSeries(seriesTarget.id)
            setSeriesTarget(null)
          }}
          onSecondary={() => {
            onDeleteSeries(seriesTarget.id)
            setSeriesTarget(null)
          }}
          onCancel={() => setSeriesTarget(null)}
        />
      )}
    </>
  )
}

function statusChipClass(s) {
  if (s === 'Completada') return 'chip--ok'
  if (s === 'Cancelada') return 'chip--off'
  if (s === 'Confirmada') return 'chip--info'
  return ''
}
