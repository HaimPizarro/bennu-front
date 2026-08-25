import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../Header.jsx'
import ServicePrice from '../components/ServicePrice.jsx'
import CalendarNav from '../components/CalendarNav.jsx'
import {
  listServices,
  listAvailability,
  listAvailabilityRange,
  createPublicBooking,
  getSession,
} from '../lib/api.js'
import { categoryName } from '../lib/data.js'
import { formatDate, getMonthGrid, MONTHS, WEEKDAYS, nearestTime, maxBookingDate, MAX_BOOKING_DAYS } from '../lib/date.js'
import '../styles/agenda.css'

const EMPTY_DETAILS = { name: '', email: '', phone: '' }

const initialMonth = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

// "HH:MM" -> minutos desde medianoche.
const minutesOf = (t) => {
  const [h, m] = String(t || '0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// minutos desde medianoche -> "HH:MM".
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

export default function Agenda() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [services, setServices] = useState([])
  const [availability, setAvailability] = useState(new Map())
  const [session, setSession] = useState(null)
  const servicioDesdeUrl = (() => {
    const raw = params.get('servicio')
    const n = Number(raw)
    return raw && Number.isFinite(n) ? n : ''
  })()
  const [step, setStep] = useState(servicioDesdeUrl ? 2 : 1)
  const [serviceId, setServiceId] = useState(servicioDesdeUrl)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slotHint, setSlotHint] = useState('')
  const [details, setDetails] = useState(EMPTY_DETAILS)
  const [respuestas, setRespuestas] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingCalendar, setLoadingCalendar] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([listServices(), getSession()]).then(([sv, s]) => {
      if (alive) {
        const active = sv.filter((x) => x.active)
        setServices(active)
        setSession(s || null)
        setLoadingServices(false)
        if (servicioDesdeUrl && active.some((x) => x.id === servicioDesdeUrl)) {
          setStep(2)
        }
      }
    })
    return () => {
      alive = false
    }
  }, [servicioDesdeUrl])

  // Disponibilidad de los próximos 45 días en UNA llamada (dots del calendario).
  useEffect(() => {
    let alive = true
    const now = new Date()
    const from = now.toISOString().slice(0, 10)
    const hasta = new Date(now)
    hasta.setDate(now.getDate() + MAX_BOOKING_DAYS - 1)
    const to = hasta.toISOString().slice(0, 10)
    listAvailabilityRange(from, to).then((results) => {
      if (!alive) return
      if (results) {
        const map = new Map()
        results.forEach((av) => map.set(av.date, av))
        setAvailability(map)
      }
      setLoadingCalendar(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const service = services.find((s) => s.id === serviceId)
  const serviceCampos = service?.campos || []

  // Cuando el usuario elige un día (o cambia el servicio), refetchea ese día
  // con el servicio: el backend resuelve duración + buffers y devuelve solo
  // los slots 100% viables.
  useEffect(() => {
    let alive = true
    if (!date) return undefined
    listAvailability(date, service?.id).then((av) => {
      if (!alive) return
      setAvailability((map) => {
        const prev = map.get(date) || {}
        const next = new Map(map)
        next.set(date, { ...prev, ...(av || {}), freshServiceId: service?.id })
        return next
      })
    })
    return () => {
      alive = false
    }
  }, [date, service?.id])

  const dayAv = availability.get(date) || null
  // Mientras no llegó la disponibilidad con el servicio actual, mostramos spinner.
  const dayLoading = Boolean(date) && dayAv?.freshServiceId !== service?.id

  // Los slots ya vienen filtrados por el backend (viabilidad completa).
  const daySlots = dayAv
    ? dayAv.slots.toSorted((a, b) => a.time.localeCompare(b.time))
    : []
  const morning = daySlots.filter((s) => Number(s.time.slice(0, 2)) < 13)
  const afternoon = daySlots.filter((s) => Number(s.time.slice(0, 2)) >= 13)

  // Rango visual de la cita seleccionada: solo el tiempo real del servicio,
  // sin los márgenes de buffer (el cliente no debe verlos).
  const selectedRange =
    service && time
      ? {
          startMin: minutesOf(time),
          endMin: minutesOf(time) + (service.duration || 0),
        }
      : null

  // Slot no disponible: se informa y se sugiere el horario libre más cercano.
  const pickSlot = (slot) => {
    if (slot.available) {
      setTime(slot.time)
      setSlotHint('')
      return
    }
    const near = nearestTime(slot.time, daySlots.filter((s) => s.available).map((s) => s.time))
    setSlotHint(
      near
        ? `Horario no disponible a las ${slot.time}. El horario cercano disponible es ${near}.`
        : `Horario no disponible a las ${slot.time}. No quedan horarios libres este día.`,
    )
  }

  const canContinue =
    step === 1 ? Boolean(service)
    : step === 2 ? Boolean(time)
    : Boolean(details.name && details.email && details.phone) &&
      serviceCampos.every((c) => {
        if (!c.requerido) return true
        const v = respuestas[c.label]
        return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim())
      })

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const booking = await createPublicBooking({
        serviceId,
        fechaHora: `${date}T${time}:00`,
        ...details,
        respuestas,
      })
      navigate(`/pago/${booking.id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const pickDay = (d) => {
    setDate(d)
    setTime('')
    setSlotHint('')
  }

  const loggedPoints = service?.puntos_otorgados || 0
  const isSuscriptor = Boolean(session?.perfil?.suscripcion_activa)

  return (
    <>
      <Header />
      <main className="section">
        <div className="container">
          <p className="eyebrow">Agenda</p>
          <h1 className="section__title">Reserva tu turno</h1>

          <ol className="steps">
            <li className={step === 1 ? 'steps__item is-active' : servicioDesdeUrl ? 'steps__item is-done' : 'steps__item'}>
              Servicio
            </li>
            <li className={step === 2 ? 'steps__item is-active' : 'steps__item'}>Fecha y hora</li>
            <li className={step === 3 ? 'steps__item is-active' : 'steps__item'}>Tus datos</li>
          </ol>

          {step === 1 &&
            (loadingServices ? (
              <div className="agenda-loading">
                <span className="spinner" aria-hidden="true" />
                <p className="muted">Cargando servicios…</p>
              </div>
            ) : services.length === 0 ? (
              <p className="muted">No hay servicios disponibles por ahora.</p>
            ) : (
              <ul className="booking-services">
                {services.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={serviceId === s.id ? 'booking-service is-selected' : 'booking-service'}
                      onClick={() => setServiceId(s.id)}
                    >
                      <span className="booking-service__name">{s.name}</span>
                      <span className="booking-service__meta">
                        {categoryName(s.category)} · {s.duration} min
                      </span>
                         <span className="booking-service__foot">
                         <span className="booking-service__price">
                           <ServicePrice service={s} suscriptor={isSuscriptor} />
                         </span>
                         <span className="booking-service__points">+{s.puntos_otorgados || 0} pts</span>
                       </span>
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {step === 2 &&
            (loadingCalendar ? (
              <div className="agenda-loading">
                <span className="spinner" aria-hidden="true" />
                <p className="muted">Agendando hora…</p>
              </div>
            ) : (
            <div className="agenda-cal">
              <Calendar availability={availability} selectedDate={date} onSelectDate={pickDay} />

              <div className="agenda-slots">
                {dayLoading ? (
                  <div className="agenda-loading agenda-loading--slots">
                    <span className="spinner" aria-hidden="true" />
                    <p className="muted">Buscando horarios…</p>
                  </div>
                ) : date ? (
                  dayAv && dayAv.closed ? (
                    <p className="muted agenda-slots__empty">Este día el estudio está cerrado.</p>
                  ) : (
                    <>
                      <div className="agenda-slots__head">
                        <strong>{formatDate(date)}</strong>
                        <span className="agenda-slots__count">
                          {daySlots.filter((s) => s.available).length} horarios
                        </span>
                      </div>

                      {morning.length > 0 && (
                        <>
                          <p className="agenda-slots__label">Mañana</p>
                          <ul className="slot-grid">
                            {morning.map((slot, i, arr) => {
                              const pos = rangePos(slot.time, arr[i - 1]?.time, arr[i + 1]?.time, selectedRange)
                              const cls = [
                                'slot',
                                time === slot.time ? 'is-selected' : '',
                                slot.available ? '' : 'slot--unavailable',
                                pos ? 'slot--in-range' : '',
                                pos && pos !== 'single' ? `slot--range-${pos}` : '',
                              ]
                                .filter(Boolean)
                                .join(' ')
                              return (
                                <li key={slot.time} data-range={pos || undefined}>
                                  <button
                                    type="button"
                                    className={cls}
                                    onClick={() => pickSlot(slot)}
                                  >
                                    {slot.time}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </>
                      )}

                      {afternoon.length > 0 && (
                        <>
                          <p className="agenda-slots__label">Tarde</p>
                          <ul className="slot-grid">
                            {afternoon.map((slot, i, arr) => {
                              const pos = rangePos(slot.time, arr[i - 1]?.time, arr[i + 1]?.time, selectedRange)
                              const cls = [
                                'slot',
                                time === slot.time ? 'is-selected' : '',
                                slot.available ? '' : 'slot--unavailable',
                                pos ? 'slot--in-range' : '',
                                pos && pos !== 'single' ? `slot--range-${pos}` : '',
                              ]
                                .filter(Boolean)
                                .join(' ')
                              return (
                                <li key={slot.time} data-range={pos || undefined}>
                                  <button
                                    type="button"
                                    className={cls}
                                    onClick={() => pickSlot(slot)}
                                  >
                                    {slot.time}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </>
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

                      {dayAv && dayAv.blocked.length > 0 && (
                        <>
                          <p className="agenda-slots__label">Ocupado</p>
                          <ul className="block-bar">
                            {dayAv.blocked.map((b) => (
                              <li key={b.id} className="block-bar__item" title="Horario ya reservado">
                                <span className="block-bar__range">
                                  {fmtMinutes(b.rawStartMin)} – {fmtMinutes(b.rawEndMin)}
                                </span>
                                <span className="block-bar__track">
                                  <span
                                    className="block-bar__fill"
                                    style={{
                                      left: `${((b.rawStartMin - minutesOf('09:00')) / (dayAv.work_end - minutesOf('09:00'))) * 100}%`,
                                      width: `${((b.rawEndMin - b.rawStartMin) / (dayAv.work_end - minutesOf('09:00'))) * 100}%`,
                                    }}
                                  />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )
                ) : (
                  <p className="muted agenda-slots__empty">Elige un día en el calendario para ver los horarios.</p>
                )}
              </div>
            </div>
            ))
          }

          {step === 3 && (
            <form className="form" onSubmit={submit}>
              <fieldset className="summary">
                <legend>Resumen</legend>
                <p>
                  <strong>{service?.name}</strong> ·{' '}
                  <ServicePrice service={service} suscriptor={isSuscriptor} />{' '}
                  {session && <span className="muted">· +{loggedPoints} pts</span>}
                </p>
                {date && time && (
                  <p>
                    {formatDate(date)} a las {time} hs
                  </p>
                )}
              </fieldset>

              {serviceCampos.length > 0 && (
                <fieldset className="summary">
                  <legend>Información para tu cita</legend>
                  {serviceCampos.map((campo) => (
                    <label className="field" key={campo.label}>
                      <span className="field__label">
                        {campo.label} {campo.requerido && <span className="field__req">*</span>}
                      </span>
                      {campo.tipo === 'select' && (
                        <select
                          className="field__input"
                          value={respuestas[campo.label] || ''}
                          onChange={(e) =>
                            setRespuestas({ ...respuestas, [campo.label]: e.target.value })
                          }
                        >
                          <option value="">Selecciona…</option>
                          {(campo.opciones || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                      {campo.tipo === 'multiselect' && (
                        <div className="check-group">
                          {(campo.opciones || []).map((opt) => {
                            const checked = (respuestas[campo.label] || []).includes(opt)
                            return (
                              <label key={opt} className="check-group__item">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const cur = respuestas[campo.label] || []
                                    const next = checked
                                      ? cur.filter((x) => x !== opt)
                                      : [...cur, opt]
                                    setRespuestas({ ...respuestas, [campo.label]: next })
                                  }}
                                />
                                <span>{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                      {campo.tipo === 'text' && (
                        <input
                          className="field__input"
                          value={respuestas[campo.label] || ''}
                          onChange={(e) =>
                            setRespuestas({ ...respuestas, [campo.label]: e.target.value })
                          }
                          required={Boolean(campo.requerido)}
                        />
                      )}
                    </label>
                  ))}
                </fieldset>
              )}

              <label className="field">
                <span className="field__label">Nombre</span>
                <input
                  className="field__input"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  className="field__input"
                  type="email"
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Teléfono</span>
                <input
                  className="field__input"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                  required
                />
              </label>

              {session ? (
                <p className="form__hint">
                  Estás logueado como {session.perfil?.nombre || session.user?.email}. Al confirmar,
                  estos puntos se acreditan a tu cuenta de fidelización.
                </p>
              ) : (
                <p className="form__hint">
                  Si quieres acumular puntos de fidelización, ingresa con tu cuenta. Puedes reservar igual
                  sin cuenta.
                </p>
              )}

              {error && (
                <p className="form__error" role="alert">
                  {error}
                </p>
              )}

              <button className="btn btn--primary" type="submit" disabled={!canContinue || submitting}>
                {submitting ? 'Procesando…' : 'Confirmar reserva'}
              </button>
            </form>
          )}

          <div className="booking-nav">
            {step > 1 && (
              <button className="btn btn--ghost" type="button" onClick={() => setStep(step - 1)}>
                Volver
              </button>
            )}
            {step < 3 && (
              <button className="btn btn--primary" type="button" disabled={!canContinue} onClick={() => setStep(step + 1)}>
                Continuar
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  )
}