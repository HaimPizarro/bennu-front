const cx = 40
const cy = 40
const r = 32
const CIRC = 2 * Math.PI * r

export function Donut({ data, size = 168 }) {
  const total = data.reduce((acc, d) => acc + d.value, 0)
  const segments = data.reduce((acc, d) => {
    const frac = total > 0 ? d.value / total : 0
    const offset = -(acc.cum || 0) * CIRC
    acc.cum = (acc.cum || 0) + frac
    acc.list.push({ ...d, dash: `${frac * CIRC} ${CIRC}`, offset })
    return acc
  }, { list: [], cum: 0 }).list
  return (
    <div className="chart-donut" style={{ width: size }}>
      <svg viewBox="0 0 80 80" role="img" aria-label="Distribución de citas">
        {segments.map((d) => (
          <circle
            key={d.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="7"
            strokeDasharray={d.dash}
            strokeDashoffset={d.offset}
          />
        ))}
      </svg>
      <div className="chart-donut__center">
        <strong>{total}</strong>
        <span>citas</span>
      </div>
    </div>
  )
}

export function Bars({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="chart-bars" role="img" aria-label="Servicios más populares">
      {data.map((d) => (
        <div className="chart-bar" key={d.label}>
          <div className="chart-bar__track">
            <div
              className="chart-bar__fill"
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
          <div className="chart-bar__labels">
            <span>{d.label}</span>
            <span className="chart-bar__value">{d.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Line({ points, height = 120, width = 320 }) {
  const max = Math.max(...points, 1)
  const step = width / Math.max(points.length - 1, 1)
  const coords = points.map((p, i) => [
    Math.round(i * step),
    Math.round(height - (p / max) * (height - 8) - 4),
  ])
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
  return (
    <svg className="chart-line" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Ingresos del mes">
      <path className="chart-line__area" d={`${d} L${width} ${height} L0 ${height} Z`} />
      <path className="chart-line__path" d={d} fill="none" />
    </svg>
  )
}
