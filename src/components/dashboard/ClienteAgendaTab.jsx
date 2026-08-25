import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listServices, listAvailability, listAvailabilityRange, createPublicBooking } from '../../lib/api.js'
import { getMonthGrid, MONTHS, WEEKDAYS, nearestTime, maxBookingDate, MAX_BOOKING_DAYS } from '../../lib/date.js'
import { toast } from '../../lib/toast.js'
import ServicePrice from '../ServicePrice.jsx'
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

export default function ClienteAgendaTab({ perfil, onRefresh }) {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [availability, setAvailability] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slotHint, setSlotHint] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let alive = true
    listServices().then((sv) => {
      if (!alive) return
      setServices(sv.filter((s) => s.active))
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
    listAvailabilityRange(from, to).then((days) => {
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

  const service = services.find((s) => s.id === serviceId)

  // Refetchea el día elegido con el servicio: el backend resuelve duración +
  // buffers y devuelve solo los slots 100% viables.
  useEffect(() => {
    let alive = true
    if (!date) return undefined
    listAvailability(date, service?.id).then((av) => {
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
  }, [date, service?.id])

  const dayAv = availability.get(date) || null

  const daySlots = dayAv
    ? dayAv.slots.toSorted((a, b) => a.time.localeCompare(b.time))
    : []
  const morning = daySlots.filter((s) => Number(s.time.slice(0, 2)) < 13)
  const afternoon = daySlots.filter((s) => Number(s.time.slice(0, 2)) >= 13)
  const hasAnyAvailable = daySlots.some((s) => s.available)
  const canBook = Boolean(service && time)

  // Rango visual de la cita seleccionada: solo el tiempo real del servicio,
  // sin los márgenes de buffer (el cliente no debe verlos).
  const selectedRange =
    service && time
      ? {
          startMin: minutesOf(time),
          endMin: minutesOf(time) + (service.duration || 0),
        }
      : null

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

  const submit = async (e) => {
    e.preventDefault()
    if (!service || !time) return
    setSubmitting(true)
    try {
      const booking = await createPublicBooking({
        serviceId: service.id,
        fechaHora: `${date}T${time}:00`,
        name: perfil?.nombre || '',
        email: perfil?.email || '',
        phone: perfil?.telefono || '',
      })
      navigate(`/pago/${booking.id}`)
    } catch (err) {
      toast.error(err.message || 'Error al reservar el turno')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Agenda</h1>
      </div>

      <section className="panel">
        <h2 className="panel__title">1 · Elige un servicio</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : (
          <div className="combo-grid">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                className={serviceId === s.id ? 'combo-card is-selected' : 'combo-card'}
                onClick={() => {
                  setServiceId(s.id)
                  setDate('')
                  setTime('')
                }}
              >
                <span className="combo-card__name">{s.name}</span>
                <span className="combo-card__services">{s.duration} min</span>
                <span className="combo-card__cost">
                  <ServicePrice service={s} suscriptor={Boolean(perfil?.suscripcion_activa)} />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {service && (
        <section className="panel">
          <h2 className="panel__title">2 · Elige fecha y hora</h2>
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
                  {selectedRange && (
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
                    <form onSubmit={submit}>
                      <button className="btn btn--primary" type="submit" disabled={submitting || !canBook}>
                        {submitting ? 'Reservando…' : `Reservar y pagar`}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
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
