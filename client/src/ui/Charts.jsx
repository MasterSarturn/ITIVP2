import { formatMoney } from '../utils/format'

export function Stat({ label, value, unit, note, hero }) {
  return (
    <div className={`card stat ${hero ? 'hero' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}{unit && <small>{unit}</small>}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  )
}

// Столбчатая диаграмма выручки по дням на чистом SVG.
// countKey - поле с числом событий за день (orders у админа, sales у продавца)
export function RevenueChart({ days, countKey = 'orders', countLabel = 'заказов', label = 'Выручка по дням' }) {
  const width = 720
  const height = 200
  const padding = { top: 12, bottom: 24, left: 8, right: 8 }
  const max = Math.max(...days.map((day) => Number(day.revenue)), 1)
  const slot = (width - padding.left - padding.right) / days.length
  const plotHeight = height - padding.top - padding.bottom
  const tick = Math.max(1, Math.round(days.length / 6))
  const formatDay = (date) => date.slice(8, 10) + '.' + date.slice(5, 7)

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {[0, 0.5, 1].map((part) => {
        const y = padding.top + plotHeight * (1 - part)
        return <line key={part} className="grid" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
      })}
      {days.map((day, index) => {
        const value = Number(day.revenue)
        const barHeight = value > 0 ? Math.max((value / max) * plotHeight, 2) : 0
        const x = padding.left + index * slot + slot * 0.18
        return (
          <g key={day.date}>
            <rect className="bar" x={x} y={padding.top + plotHeight - barHeight} width={slot * 0.64} height={barHeight} rx="2">
              <title>{`${formatDay(day.date)}: ${formatMoney(day.revenue)} BYN, ${countLabel}: ${day[countKey]}`}</title>
            </rect>
            {(index % tick === 0 || index === days.length - 1) && (
              <text x={x + slot * 0.32} y={height - 6} textAnchor="middle">{formatDay(day.date)}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
