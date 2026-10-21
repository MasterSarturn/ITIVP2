import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api/admin'
import { useLoad } from '../hooks/usePagedList'
import { ErrorNote, PageHead, Skeleton } from '../ui/Feedback'
import StatusBadge from '../ui/StatusBadge'
import { formatDateTime, formatMoney, formatNumber, fullName, shortId } from '../utils/format'

function Stat({ label, value, unit, note, hero }) {
  return (
    <div className={`card stat ${hero ? 'hero' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}{unit && <small>{unit}</small>}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  )
}

// Столбчатая диаграмма выручки по дням на чистом SVG
function RevenueChart({ days }) {
  const width = 720
  const height = 200
  const padding = { top: 12, bottom: 24, left: 8, right: 8 }
  const max = Math.max(...days.map((day) => Number(day.revenue)), 1)
  const slot = (width - padding.left - padding.right) / days.length
  const plotHeight = height - padding.top - padding.bottom
  const formatDay = (date) => date.slice(8, 10) + '.' + date.slice(5, 7)

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Выручка по дням за 30 дней">
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
              <title>{`${formatDay(day.date)}: ${formatMoney(day.revenue)} BYN, заказов: ${day.orders}`}</title>
            </rect>
            {(index % 5 === 0 || index === days.length - 1) && (
              <text x={x + slot * 0.32} y={height - 6} textAnchor="middle">{formatDay(day.date)}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useLoad(api.stats, [])

  if (error) return <><PageHead title="Обзор" /><ErrorNote message={error} onRetry={reload} /></>

  if ((loading && !data) || !data) {
    return (
      <>
        <PageHead title="Обзор" />
        <div className="stat-grid">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={130} />)}</div>
      </>
    )
  }

  const recentOrders = data.recentOrders ?? []
  const monthRevenue =data.daily.reduce((sum, day) => sum + Number(day.revenue), 0)
  const monthOrders = data.daily.reduce((sum, day) => sum + day.orders, 0)
  const staff = data.users.byRole.seller + data.users.byRole.admin

  return (
    <div className="stack">
      <PageHead title="Обзор" subtitle="Сводка по магазину" />

      {data.orders.pending > 0 && (
        <div className="alert">
          Заказов, ожидающих оплаты: <b>{data.orders.pending}</b>.
          <Link to="/admin/orders?status=pending">Открыть</Link>
        </div>
      )}

      <div className="stat-grid">
        <Stat hero label="Выручка" value={formatMoney(data.revenue)} unit="BYN" note={`За 30 дней: ${formatMoney(monthRevenue)} BYN`} />
        <Stat label="Оплаченных заказов" value={formatNumber(data.orders.paid)} note={`За 30 дней: ${formatNumber(monthOrders)}`} />
        <Stat label="Опубликовано товаров" value={formatNumber(data.products.published)} note={`Черновиков: ${data.products.draft}, в архиве: ${data.products.archived}`} />
        <Stat label="Активных пользователей" value={formatNumber(data.users.byStatus.active)} note={`Продавцов и админов: ${staff}, заблокировано: ${data.users.byStatus.blocked}`} />
      </div>

      <div className="grid-sidebar">
        <section className="card">
          <div className="card-head">
            <h2>Выручка за 30 дней</h2>
            <span className="muted">Возвраты: {formatMoney(data.refunded)} BYN</span>
          </div>
          <div className="card-pad"><RevenueChart days={data.daily} /></div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Топ товаров</h2></div>
          {data.topProducts.length === 0 ? (
            <div className="empty"><strong>Продаж пока нет</strong></div>
          ) : (
            <ol className="rank">
              {data.topProducts.map((product, index) => (
                <li key={product.id}>
                  <span className="n">{index + 1}</span>
                  <Link to={`/admin/products/${product.id}`}>{product.name}</Link>
                  <span className="mono nowrap">{formatMoney(product.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Последние заказы</h2>
          <Link to="/admin/orders">Все заказы</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Заказ</th><th>Покупатель</th><th>Статус</th><th className="right">Сумма, BYN</th><th>Создан</th></tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="clickable" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                  <td className="mono">{shortId(order.id)}</td>
                  <td>
                    <div className="cell-title">{fullName(order.user)}</div>
                    <div className="cell-sub">{order.user?.account?.email}</div>
                  </td>
                  <td><StatusBadge kind="order" value={order.status} /></td>
                  <td className="right mono">{formatMoney(order.totalAmount)}</td>
                  <td className="nowrap">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && <div className="empty"><strong>Заказов пока нет</strong></div>}
        </div>
      </section>
    </div>
  )
}
