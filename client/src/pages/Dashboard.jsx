import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api/admin'
import { useLoad } from '../hooks/usePagedList'
import { ErrorNote, PageHead, Skeleton } from '../ui/Feedback'
import { RevenueChart, Stat } from '../ui/Charts'
import StatusBadge from '../ui/StatusBadge'
import { formatDateTime, formatMoney, formatNumber, fullName, shortId } from '../utils/format'

const PERIODS = [7, 30, 90]

function Funnel({ funnel }) {
  const steps = [
    { label: 'Создано заказов', value: funnel.created },
    { label: 'Оплачено', value: funnel.paid },
  ]
  const max = Math.max(funnel.created, 1)

  return (
    <div className="card-pad stack" style={{ gap: 12 }}>
      {steps.map((step) => (
        <div key={step.label}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{step.label}</span>
            <b className="mono">{formatNumber(step.value)}</b>
          </div>
          <div className="meter" role="img" aria-label={`${step.label}: ${step.value} из ${funnel.created}`}>
            <span style={{ width: `${(step.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="muted" style={{ margin: 0 }}>
        Конверсия в оплату: <b>{funnel.conversion}%</b>. Отменено: {funnel.cancelled}, возвратов: {funnel.refunded}.
      </p>
    </div>
  )
}

function Categories({ items }) {
  if (items.length === 0) return <div className="empty"><strong>Продаж за период нет</strong></div>
  const max = Math.max(...items.map((item) => Number(item.revenue)), 1)

  return (
    <ul className="bars">
      {items.map((item) => (
        <li key={item.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{item.name}</span>
            <span className="mono nowrap">{formatMoney(item.revenue)} BYN</span>
          </div>
          <div className="meter" role="img" aria-label={`${item.name}: ${formatMoney(item.revenue)} BYN, продаж: ${item.sales}`}>
            <span style={{ width: `${(Number(item.revenue) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const { data, loading, error, reload } = useLoad(() => api.stats(days), [days])

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
  const monthRevenue = data.daily.reduce((sum, day) => sum + Number(day.revenue), 0)
  const monthOrders = data.daily.reduce((sum, day) => sum + day.orders, 0)
  const staff = data.users.byRole.seller + data.users.byRole.admin

  return (
    <div className="stack">
      <PageHead
        title="Обзор"
        subtitle="Сводка по магазину"
        actions={(
          <div className="chips" role="group" aria-label="Период">
            {PERIODS.map((value) => (
              <button key={value} className={`chip ${days === value ? 'on' : ''}`} aria-pressed={days === value} onClick={() => setDays(value)}>{value} дн.</button>
            ))}
          </div>
        )}
      />

      {data.orders.pending > 0 && (
        <div className="alert">
          Заказов, ожидающих оплаты: <b>{data.orders.pending}</b>.
          <Link to="/admin/orders?status=pending">Открыть</Link>
        </div>
      )}

      <div className="stat-grid">
        <Stat hero label="Выручка" value={formatMoney(data.revenue)} unit="BYN" note={`За ${data.days} дн.: ${formatMoney(monthRevenue)} BYN`} />
        <Stat label="Оплаченных заказов" value={formatNumber(data.orders.paid)} note={`За ${data.days} дн.: ${formatNumber(monthOrders)}`} />
        <Stat label="Опубликовано товаров" value={formatNumber(data.products.published)} note={`Черновиков: ${data.products.draft}, в архиве: ${data.products.archived}`} />
        <Stat label="Активных пользователей" value={formatNumber(data.users.byStatus.active)} note={`Продавцов и админов: ${staff}, заблокировано: ${data.users.byStatus.blocked}`} />
      </div>

      <div className="grid-sidebar">
        <section className="card">
          <div className="card-head">
            <h2>Выручка за {data.days} дн.</h2>
            <span className="muted">Возвраты: {formatMoney(data.refunded)} BYN</span>
          </div>
          <div className="card-pad"><RevenueChart days={data.daily} label={`Выручка по дням за ${data.days} дней`} /></div>
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

      <div className="grid-sidebar" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <section className="card">
          <div className="card-head"><h2>Воронка заказов</h2><span className="muted">Заказы за {data.days} дн.</span></div>
          <Funnel funnel={data.funnel} />
        </section>
        <section className="card">
          <div className="card-head"><h2>Выручка по категориям</h2><span className="muted">За {data.days} дн.</span></div>
          <div className="card-pad"><Categories items={data.byCategory} /></div>
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
