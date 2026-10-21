import { Link, useNavigate, useParams } from 'react-router-dom'
import * as api from '../../api/shop'
import { useLoad, usePagedList } from '../../hooks/usePagedList'
import { useShop } from '../../state/ShopContext'
import { ErrorNote, Skeleton, useToast } from '../../ui/Feedback'
import StatusBadge from '../../ui/StatusBadge'
import { formatDateTime, formatMoney, shortId } from '../../utils/format'
import { Empty, Pager } from '../components/parts'

export function MyOrders() {
  const navigate = useNavigate()
  const list = usePagedList(api.orders.list)

  return (
    <div className="stack">
      <h1>Мои заказы</h1>
      <ErrorNote message={list.error} onRetry={list.reload} />
      {list.loading && !list.data && <Skeleton height={200} />}
      {list.data && (list.data.items.length === 0 ? (
        <Empty title="Заказов пока нет" action={<Link className="btn btn-primary" to="/">В каталог</Link>} />
      ) : (
        <>
          <section className="card table-wrap">
            <table className="table">
              <thead><tr><th>Заказ</th><th>Товары</th><th>Статус</th><th className="right">Сумма, BYN</th><th>Создан</th></tr></thead>
              <tbody>
                {list.data.items.map((order) => (
                  <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                    <td className="mono">{shortId(order.id)}</td>
                    <td>{order.items.map((item) => item.product.name).join(', ')}</td>
                    <td><StatusBadge kind="order" value={order.status} /></td>
                    <td className="right mono">{formatMoney(order.totalAmount)}</td>
                    <td className="nowrap">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <Pager data={list.data} onPage={list.setPage} />
        </>
      ))}
    </div>
  )
}

export function OrderPage() {
  const { id } = useParams()
  const toast = useToast()
  const { reloadCart } = useShop()
  const order = useLoad(() => api.orders.get(id), [id])
  const payments = useLoad(() => api.orders.payments(id), [id])

  async function cancel() {
    try {
      await api.orders.cancel(id)
      await reloadCart()
      toast.success('Заказ отменён')
      order.reload()
      payments.reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (order.error) return <><Link to="/orders">← Заказы</Link><ErrorNote message={order.error} onRetry={order.reload} /></>
  if (!order.data) return <Skeleton height={260} />

  const data = order.data

  return (
    <div className="narrow stack">
      <Link to="/orders" className="muted">← Заказы</Link>
      <h1>Заказ {shortId(data.id)}</h1>
      <section className="card card-pad stack" style={{ gap: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <StatusBadge kind="order" value={data.status} />
          <span className="muted">{formatDateTime(data.createdAt)}</span>
        </div>
        <ul className="plain-list">
          {data.items.map((item) => (
            <li key={item.id}><Link to={`/products/${item.product.id}`}>{item.product.name}</Link><span className="mono">{formatMoney(item.unitPrice)}</span></li>
          ))}
        </ul>
        <div className="summary-total"><span>Итого</span><strong>{formatMoney(data.totalAmount)} <small>BYN</small></strong></div>
        <div className="row">
          {data.status === 'pending' && <Link className="btn btn-primary" to={`/checkout/${data.id}`}>Оплатить</Link>}
          {data.status === 'pending' && <button className="btn btn-danger" onClick={cancel}>Отменить</button>}
          {data.status === 'paid' && <Link className="btn btn-primary" to="/library">Скачать файлы</Link>}
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Платежи</h2></div>
        <ErrorNote message={payments.error} onRetry={payments.reload} />
        {payments.data?.length === 0 && <Empty title="Платежей нет" />}
        {payments.data?.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Создан</th><th>Статус</th><th className="right">Сумма, BYN</th></tr></thead>
              <tbody>
                {payments.data.map((payment) => (
                  <tr key={payment.id}>
                    <td className="nowrap">{formatDateTime(payment.createdAt)}</td>
                    <td><StatusBadge kind="payment" value={payment.status} /></td>
                    <td className="right mono">{formatMoney(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
