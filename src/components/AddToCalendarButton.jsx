import { buildGoogleCalendarUrl } from '../lib/gcal.js'

export default function AddToCalendarButton({
  title,
  startDate,
  startTime,
  durationMin = 60,
  details = '',
  location = '',
  className = 'btn btn--ghost btn--sm',
}) {
  if (!title || !startDate || !startTime) return null
  const href = buildGoogleCalendarUrl({
    title,
    startISO: `${startDate}T${startTime}:00`,
    durationMin,
    details,
    location,
  })
  if (!href) return null
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      Agregar a mi calendario
    </a>
  )
}