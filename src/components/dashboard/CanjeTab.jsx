import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCombos, listServices, listComboAvailability, listComboAvailabilityRange, redeemCombo } from '../../lib/api.js'
import { formatDate, getMonthGrid, MONTHS, WEEKDAYS, nearestTime, maxBookingDate, MAX_BOOKING_DAYS } from '../../lib/date.js'
import { toast } from '../../lib/toast.js'
import Modal from '../Modal.jsx'
import CalendarNav from '../CalendarNav.jsx'
import '../../styles/agenda.css'

const initialMonth = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

const minutesOf = (t) => {
  const [h, m] = String(t || '0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const fmtMinutes = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Posición de un slot dentro del bloque seleccionado: '', 'single', 'start', 'mid' o 'end'.
const rangePos = (currentTime, prevTime, nextTime, range) => {
  if (!range) return ''
  const inRange = (t) => {
    if (!t) return false
    const m = minutesOf(t)
    return m >= range.startMin && m < range.endMin
  }
  if (!inRange(currentTime)) return ''
  const hasPrev = inRange(prevTime)
  const hasNext = inRange(nextTime)
  if (!hasPrev && !hasNext) return 'single'
  if (!hasPrev) return 'start'
  if (!hasNext) return 'end'
  return 'mid'
}

export default function CanjeTab({ perfil, onRefresh }) {
  const navigate = useNavigate()
  const [combos, setCombos] = useState([])
  const [serviceById, setServiceById] = useState(new Map())
  const [availability, setAvailability] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedComboId, setSelectedComboId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slotHint, setSlotHint] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [payDifference, setPayDifference] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([listCombos(), listServices()]).then(([cb, sv]) => {
      if (!alive) return
      setCombos(cb)
      setServiceById(new Map(sv.filter(Boolean).map((s) => [s.id, s])))
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  // Disponibilidad de los próximos 45 días en UNA llamada (dots del calendario).
  useEffect(() => {
    let alive = true
    const now = new Date()
    const from = now.toISOString().slice(0, 10)
    const hasta = new Date(now)
    hasta.setDate(now.getDate() + MAX_BOOKING_DAYS - 1)
    const to = hasta.toISOString().slice(0, 10)
    listComboAvailabilityRange(from, to).then((days) => {
      if (!alive) return
      if (days) {
        const map = new Map()
        days.forEach((av) => map.set(av.date, av))
        setAvailability(map)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const combo = combos.find((c) => c.id === selectedComboId)
  const dayAv = availability.get(date) || null
  const comboDuration = Math.max(
    0,
    ...(combo?.servicios_ids || [])
      .map((id) => serviceById.get(id)?.duration)
      .filter(Boolean)
  )
  const comboCapacidad = Math.min(
    1,
    ...(combo?.servicios_ids || [])
      .map((id) => serviceById.get(id)?.capacidad)
      .filter((c) => c != null)
  )

  // Rango visual de la cita seleccionada: solo el tiempo real del servicio,
  // sin los márgenes de buffer (el cliente no debe verlos).
  const selectedRange =
    combo && time
      ? {
          startMin: minutesOf(time),
          endMin: minutesOf(time) + comboDuration,
        }
      : null

  // Refetchea el día elegido con la duración del combo: el backend devuelve
  // solo los slots 100% viables.
  useEffect(() => {
    let alive = true
    if (!date) return undefined
    listComboAvailability(date, comboDuration, comboCapacidad).then((av) => {
      if (!alive || !av) return
      setAvailability((map) => {
        const next = new Map(map)
        next.set(date, av)
        return next
      })
    })
    return () => {
      alive = false
    }
  }, [date, comboDuration, comboCapacidad])

  const daySlots = dayAv
    ? dayAv.slots.toSorted((a, b) => a.time.localeCompare(b.time))
    : []
  const morning = daySlots.filter((s) => Number(s.time.slice(0, 2)) < 13)
  const afternoon = daySlots.filter((s) => Number(s.time.slice(0, 2)) >= 13)
  const hasAnyAvailable = daySlots.some((s) => s.available)
  const canRedeem = Boolean(combo && time)
  const puntosDisponibles = Number(perfil?.puntos_acumulados) || 0
  const falta = combo ? combo.costo - puntosDisponibles : 0
  const tienePuntos = !combo || puntosDisponibles >= combo.costo

  const comboDescription = (c) =>
    (c.servicios_ids || [])
      .map((id) => serviceById.get(id)?.name)
      .filter(Boolean)
      .join(' + ')

  const pickDay = (d) => {
    setDate(d)
    setTime('')
    setSlotHint('')
  }

  // Slot no disponible: se informa y se sugiere el horario libre más cercano.
  const pickSlot = (s) => {
    if (s.available) {
      setTime(s.time)
      setSlotHint('')
      return
    }
    const near = nearestTime(s.time, daySlots.filter((x) => x.available).map((x) => x.time))
    setSlotHint(
      near
        ? `Horario no disponible a las ${s.time}. El horario cercano disponible es ${near}.`
        : `Horario no disponible a las ${s.time}. No quedan horarios libres este día.`,
    )
  }

  const submit = async (e, conDiferencia = false) => {
    e.preventDefault()
    if (!combo || !time) return
    setSubmitting(true)
    try {
      const res = await redeemCombo(combo.id, `${date}T${time}:00`, conDiferencia)
      if (conDiferencia && res?.pagoId) {
        setConfirm(null)
        setPayDifference(false)
        navigate(`/pago/canje/${res.pagoId}`)
        return
      }
      setConfirm(null)
      setPayDifference(false)
      setTime('')
      setDate('')
      setSelectedComboId('')
      toast.success('¡Combo canjeado! Revisa tus próximos servicios.')
      onRefresh?.()
    } catch (err) {
      toast.error(err.message || 'Error al canjear el combo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Canje</h1>
        <div className="dash__head-stats">
          <span className="chip">{perfil?.puntos_acumulados || 0} puntos disponibles</span>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel__title">Servicios combinados</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : combos.length === 0 ? (
          <p className="muted">No hay servicios combinados disponibles por ahora.</p>
        ) : (
          <div className="combo-grid">
            {combos.map((c) => (
              <button
                key={c.id}
                type="button"
                className={selectedComboId === c.id ? 'combo-card is-selected' : 'combo-card'}
                onClick={() => {
                  setSelectedComboId(c.id)
                  setDate('')
                  setTime('')
                }}
              >
                <span className="combo-card__name">{c.name}</span>
                <span className="combo-card__services">{comboDescription(c) || '—'}</span>
                <span className="combo-card__cost">{c.costo} pts</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {combo && (
        <section className="panel">
          <h2 className="panel__title">Elige fecha y hora</h2>
          <div className="canje-layout">
            <Calendar availability={availability} selectedDate={date} onSelectDate={pickDay} />
            <div className="agenda-slots">
              {!date ? (
                <p className="muted agenda-slots__empty">Elige un día en el calendario para ver los horarios.</p>
              ) : dayAv?.closed ? (
                <p className="muted agenda-slots__empty">Este día el estudio está cerrado.</p>
              ) : !hasAnyAvailable ? (
                <p className="muted agenda-slots__empty">No quedan horarios libres este día.</p>
              ) : (
                <>
                  {morning.length > 0 && (
                    <div className="agenda-slots__group">
                      <p className="agenda-slots__label">Mañana</p>
                      <div className="agenda-slots__list">
                        {morning.map((s, i, arr) => {
                          const pos = rangePos(s.time, arr[i - 1]?.time, arr[i + 1]?.time, selectedRange)
                          const cls = [
                            'slot-pill',
                            time === s.time ? 'is-active' : '',
                            s.available ? '' : 'slot-pill--unavailable',
                            pos ? 'slot-pill--in-range' : '',
                            pos && pos !== 'single' ? `slot-pill--range-${pos}` : '',
                          ]
                            .filter(Boolean)
                            .join(' ')
                          return (
                            <button key={s.time} type="button" className={cls} onClick={() => pickSlot(s)}>
                              {s.time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {afternoon.length > 0 && (
                    <div className="agenda-slots__group">
                      <p className="agenda-slots__label">Tarde</p>
                      <div className="agenda-slots__list">
                        {afternoon.map((s, i, arr) => {
                          const pos = rangePos(s.time, arr[i - 1]?.time, arr[i + 1]?.time, selectedRange)
                          const cls = [
                            'slot-pill',
                            time === s.time ? 'is-active' : '',
                            s.available ? '' : 'slot-pill--unavailable',
                            pos ? 'slot-pill--in-range' : '',
                            pos && pos !== 'single' ? `slot-pill--range-${pos}` : '',
                          ]
                            .filter(Boolean)
                            .join(' ')
                          return (
                            <button key={s.time} type="button" className={cls} onClick={() => pickSlot(s)}>
                              {s.time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {combo && time && selectedRange && (
                    <div className="range-bar">
                      <span className="range-bar__label">
                        Ocupa de {fmtMinutes(selectedRange.startMin)} a{' '}
                        {fmtMinutes(selectedRange.endMin)} ·{' '}
                        {selectedRange.endMin - selectedRange.startMin} min
                      </span>
                      <span className="range-bar__track">
                        <span
                          className="range-bar__fill"
                          style={{
                            left: `${((selectedRange.startMin - minutesOf('09:00')) / (dayAv.work_end - minutesOf('09:00'))) * 100}%`,
                            width: `${((selectedRange.endMin - selectedRange.startMin) / (dayAv.work_end - minutesOf('09:00'))) * 100}%`,
                          }}
                        />
                      </span>
                    </div>
                  )}
                  {slotHint && (
                    <p className="agenda-slots__hint" role="status">
                      {slotHint}
                    </p>
                  )}
                  {time && (
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => {
                        if (!tienePuntos) {
                          setPayDifference(true)
                          return
                        }
                        setConfirm({ date, time })
                      }}
                      disabled={!canRedeem}
                    >
                      Canjear combo
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {payDifference && combo && (
        <Modal title="Puntos insuficientes" onClose={() => setPayDifference(false)}>
          <p className="modal__text">
            No cuentas con los puntos suficientes para hacer el canje.
            <br />
            <strong>{combo.name}</strong> cuesta <strong>{combo.costo} pts</strong> y tienes{' '}
            <strong>{puntosDisponibles} pts</strong>.
            <br />
            Vas a abonar la diferencia de <strong>${falta}</strong> con Mercado Pago (1 punto = $1).
          </p>
          <div className="modal__actions">
            <button className="btn btn--ghost" type="button" onClick={() => setPayDifference(false)}>
              Cancelar
            </button>
            <form onSubmit={(e) => submit(e, true)} className="modal__form">
              <button className="btn btn--primary" type="submit" disabled={submitting}>
                {submitting ? 'Preparando pago…' : 'Pagar diferencia con Mercado Pago'}
              </button>
            </form>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal title="Confirmar canje" onClose={() => setConfirm(null)}>
          <p className="modal__text">
            Vas a canjear <strong>{combo.name}</strong> por <strong>{combo.costo} puntos</strong>
            <br />
            {formatDate(confirm.date)} a las {confirm.time} hs.
          </p>
          <div className="modal__actions">
            <button className="btn btn--ghost" type="button" onClick={() => setConfirm(null)}>
              Cancelar
            </button>
            <form onSubmit={submit} className="modal__form">
              <button className="btn btn--primary" type="submit" disabled={submitting}>
                {submitting ? 'Canjeando…' : 'Confirmar canje'}
              </button>
            </form>
          </div>
        </Modal>
      )}
    </>
  )
}

function Calendar({ availability, selectedDate, onSelectDate }) {
  const [{ year, month }, setCursor] = useState(initialMonth)
  const cells = getMonthGrid(year, month)
  const maxDate = maxBookingDate()

  return (
    <div className="calendar">
      <div className="calendar__header">
        <CalendarNav
          year={year}
          month={month}
          onChange={(y, m) => setCursor({ year: y, month: m })}
          onToday={() => setCursor(initialMonth())}
        />
      </div>

      <div className="calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar__weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="calendar__grid">
        {cells.map((cell) => {
          const av = availability.get(cell.date)
          const available = av ? av.slots.filter((s) => s.available).length : 0
          const beyondLimit = !cell.isPast && cell.date > maxDate
          const selectable = !cell.isPast && !beyondLimit && available > 0
          const classes = [
            'calendar__day',
            cell.isCurrentMonth ? '' : 'calendar__day--outside',
            cell.isPast ? 'calendar__day--past' : '',
            beyondLimit ? 'calendar__day--locked' : '',
            cell.isToday ? 'calendar__day--today' : '',
            selectedDate === cell.date ? 'calendar__day--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={cell.date}
              type="button"
              disabled={!selectable}
              className={classes}
              onClick={() => onSelectDate(cell.date)}
              aria-label={`${cell.dayNum} de ${MONTHS[month]}`}
            >
              <span className="calendar__day-num">{cell.dayNum}</span>
              {cell.isCurrentMonth && !cell.isPast && (
                <span className="calendar__dots" aria-hidden="true">
                  {available === 0 && <span className="calendar__dot" />}
                  {available > 0 && (
                    <>
                      <span className="calendar__dot calendar__dot--avail" />
                      {available > 2 && <span className="calendar__dot calendar__dot--avail" />}
                      {available > 5 && <span className="calendar__dot calendar__dot--avail" />}
                    </>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
