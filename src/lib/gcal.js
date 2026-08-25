const TIMEZONE = 'America/Santiago'

// "YYYY-MM-DDTHH:MM:SS" (coordenadas del horario mostrado al cliente) -> "YYYYMMDDTHHMMSS" local.
const fmtStamps = (d) => {
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

// Arma la URL "action=TEMPLATE" de Google Calendar para guardar el evento en la
// agenda del cliente con un solo clic (sin OAuth del lado del cliente).
export function buildGoogleCalendarUrl({ title, startISO, durationMin = 60, details = '', location = '', timezone = TIMEZONE }) {
  if (!title || !startISO) return ''
  const start = new Date(`${startISO.slice(0, 19)}`)
  const end = new Date(start.getTime() + (Number(durationMin) || 60) * 60000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmtStamps(start)}/${fmtStamps(end)}`,
    ctz: timezone,
  })
  if (details) params.set('details', details)
  if (location) params.set('location', location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}