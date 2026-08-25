export const toISODate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

export const getTodayISO = () => toISODate(new Date())

// Los clientes solo pueden agendar turnos con hasta 30 días corridos de anticipación.
export const MAX_BOOKING_DAYS = 30

// Última fecha agendable para clientes: hoy + MAX_BOOKING_DAYS (incluida).
export const maxBookingDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + MAX_BOOKING_DAYS)
  return toISODate(d)
}

export const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const getMonthGrid = (year, month) => {
  const today = getTodayISO()
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(firstOfMonth)
  const offset = (firstOfMonth.getDay() + 6) % 7
  start.setDate(1 - offset)

  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const date = toISODate(d)
    cells.push({
      date,
      dayNum: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: date === today,
      isPast: date < today,
    })
  }
  return cells
}

// Devuelve el horario ("HH:MM") disponible más cercano a `time` entre una lista
// de horarios. En empate prefiere el anterior. null si no hay ninguno.
export const nearestTime = (time, times) => {
  const toMin = (t) => {
    const [h, m] = String(t || '0').split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const list = (Array.isArray(times) ? times : []).filter(Boolean)
  if (list.length === 0) return null
  const target = toMin(time)
  return list.reduce((best, cur) => {
    const d = Math.abs(toMin(cur) - target)
    const bd = Math.abs(toMin(best) - target)
    if (d < bd) return cur
    if (d === bd && toMin(cur) < toMin(best)) return cur
    return best
  }, list[0])
}
