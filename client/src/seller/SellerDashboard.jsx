import { useState } from 'react'
import { Link } from 'react-router-dom'
import { seller } from '../api/seller'
import { useLoad } from '../hooks/usePagedList'
import { RevenueChart, Stat } from '../ui/Charts'
import { ErrorNote, PageHead, Skeleton } from '../ui/Feedback'
import Icon from '../ui/Icon'
import { formatMoney, formatNumber } from '../utils/format'

const PERIODS = [7, 30, 90]

export default function SellerDashboard() {
  const [days, setDays] = useState(30)
  const { data, loading, error, reload } = useLoad(() => seller.stats(days), [days])

  const head = (
    <PageHead
      title="Обзор"
      subtitle="Ваши продажи и товары"
      actions={<Link className="btn btn-primary" to="/seller/products/new"><Icon name="plus" />Новый товар</Link>}
    />
  )

  if (error) return <>{head}<ErrorNote message={error} onRetry={reload} /></>
  if (!data) return <>{head}<div className="stat-grid">{[0, 1, 2].map((i) => <Skeleton key={i} height={130} />)}</div></>

  const periodRevenue = data.daily.reduce((sum, day) => sum + Number(day.revenue), 0)
  const periodSales = data.daily.reduce((sum, day) => sum + day.sales, 0)

  return (
    <div className="stack" aria-busy={loading}>
      {head}
      <div className="stat-grid">
        <Stat hero label="Выручка" value={formatMoney(data.revenue)} unit="BYN" note={`За ${data.days} дн.: ${formatMoney(periodRevenue)} BYN`} />
        <Stat label="Продаж" value={formatNumber(data.sales)} note={`За ${data.days} дн.: ${formatNumber(periodSales)}`} />
        <Stat label="Опубликовано товаров" value={formatNumber(data.products.published)} note={`Черновиков: ${data.products.draft}, в архиве: ${data.products.archived}`} />
      </div>

      <div className="grid-sidebar">
        <section className="card">
          <div className="card-head">
            <h2>Выручка за {data.days} дн.</h2>
            <div className="chips" role="group" aria-label="Период">
              {PERIODS.map((value) => (
                <button key={value} className={`chip ${days === value ? 'on' : ''}`} aria-pressed={days === value} onClick={() => setDays(value)}>{value} дн.</button>
              ))}
            </div>
          </div>
          <div className="card-pad">
            <RevenueChart days={data.daily} countKey="sales" countLabel="продаж" label={`Выручка по дням за ${data.days} дней`} />
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Топ товаров</h2></div>
          {data.topProducts.length === 0 ? (
            <div className="empty"><strong>Продаж пока нет</strong><span>Опубликуйте товар, и он появится в каталоге.</span></div>
          ) : (
            <ol className="rank">
              {data.topProducts.map((product, index) => (
                <li key={product.id}>
                  <span className="n">{index + 1}</span>
                  <Link to={`/seller/products/${product.id}`}>{product.name}</Link>
                  <span className="mono nowrap">{formatMoney(product.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
