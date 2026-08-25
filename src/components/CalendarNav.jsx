import { MONTHS } from '../lib/date.js'

// Rango dinámico del selector de año (no congelado al import): permite navegar
// el historial (−25) y planificar hacia adelante (+10) sin quedarse corto.
const MIN_YEARS_BACK = 25
const MAX_YEARS_AHEAD = 10

const yearRange = (currentYear) => {
  const years = []
  for (let y = currentYear - MIN_YEARS_BACK; y <= currentYear + MAX_YEARS_AHEAD; y += 1) years.push(y)
  return years
}

// Navegación rápida del calendario: saltos de año, mes/año en select y "Hoy".
// `onChange(year, month)` recibe el cursor nuevo; `onToday()` vuelve al mes actual.
export default function CalendarNav({ year, month, onChange, onToday }) {
  const go = (dy, dm) => {
    const d = new Date(year, month + dm + dy * 12, 1)
    onChange(d.getFullYear(), d.getMonth())
  }

  return (
    <div className="calendar__jump">
      <button type="button" className="calendar__nav-btn" aria-label="Año anterior" onClick={() => go(-1, 0)}>
        ‹‹
      </button>
      <button type="button" className="calendar__nav-btn" aria-label="Mes anterior" onClick={() => go(0, -1)}>
        ‹
      </button>
      <select
        className="calendar__select"
        aria-label="Mes"
        value={month}
        onChange={(e) => onChange(year, Number(e.target.value))}
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i}>
            {m}
          </option>
        ))}
      </select>
      <select
        className="calendar__select calendar__select--year"
        aria-label="Año"
        value={year}
        onChange={(e) => onChange(Number(e.target.value), month)}
      >
        {yearRange(new Date().getFullYear()).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <button type="button" className="calendar__nav-btn" aria-label="Mes siguiente" onClick={() => go(0, 1)}>
        ›
      </button>
      <button type="button" className="calendar__nav-btn" aria-label="Año siguiente" onClick={() => go(1, 0)}>
        ››
      </button>
      <button type="button" className="calendar__today" onClick={onToday}>
        Hoy
      </button>
    </div>
  )
}