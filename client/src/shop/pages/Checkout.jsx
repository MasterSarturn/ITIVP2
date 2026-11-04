import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../../api/shop'
import { useLoad } from '../../hooks/usePagedList'
import { useShop } from '../../state/ShopContext'
import { ErrorNote, Skeleton, useToast } from '../../ui/Feedback'
import StatusBadge from '../../ui/StatusBadge'
import { formatMoney } from '../../utils/format'

// Реального платёжного провайдера нет: в разработке ответ провайдера имитирует dev-эндпоинт
export default function Checkout() {
  const { orderId } = useParams()
  const toast = useToast()
  const { reloadPurchases, reloadCart } = useShop()
  const order = useLoad(() => api.orders.get(orderId), [orderId])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)

  async function pay(result) {
    setBusy(true)
    setNote(null)
    try {
      const { id } = await api.orders.pay(orderId)
      await api.orders.simulate(id, result)
      if (result === 'completed') {
        await reloadPurchases()
        toast.success('Оплата прошла успешно')
      } else {
        setNote('Платёж отклонён. Можно попробовать оплатить ещё раз или отменить заказ.')
      }
      order.reload()
    } catch (e) {
      // в production эндпоинта симуляции нет: статус придёт от провайдера
      setNote(e.status === 404 ? 'Ожидаем подтверждение оплаты от платёжного провайдера. Обновите страницу чуть позже.' : e.message)
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    setBusy(true)
    try {
      await api.orders.cancel(orderId)
      await reloadCart()
      toast.success('Заказ отменён')
      order.reload()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (order.error) return <ErrorNote message={order.error} onRetry={order.reload} />
  if (!order.data) return <Skeleton height={260} />

  const data = order.data

  return (
    <div className="narrow stack">
      <h1>Оплата заказа</h1>
      <section className="card card-pad stack" style={{ gap: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <StatusBadge kind="order" value={data.status} />
          <strong className="price big">{formatMoney(data.totalAmount)} <small>BYN</small></strong>
        </div>
        <ul className="plain-list">
          {data.items.map((item) => (
            <li key={item.id}><span>{item.product.name}</span><span className="mono">{formatMoney(item.unitPrice)}</span></li>
          ))}
        </ul>
        {Number(data.discountAmount) > 0 && (
          <p className="muted" style={{ margin: 0 }}>
            Скидка по промокоду {data.promoCode}: −{formatMoney(data.discountAmount)} BYN
          </p>
        )}
        {note && <div className="alert info">{note}</div>}

        {data.status === 'pending' && (
          <>
            <p className="muted">Платёжная система в этой версии — имитация: выберите результат оплаты.</p>
            <div className="row">
              <button className="btn btn-primary" disabled={busy} onClick={() => pay('completed')}>{busy ? 'Обработка…' : 'Оплатить'}</button>
              <button className="btn" disabled={busy} onClick={() => pay('failed')}>Имитировать отказ</button>
              <button className="btn btn-danger" disabled={busy} onClick={cancel}>Отменить заказ</button>
            </div>
          </>
        )}
        {data.status === 'paid' && (
          <div className="stack" style={{ gap: 12 }}>
            <div className="alert info">Заказ оплачен. Файлы доступны в разделе «Мои покупки».</div>
            <div><Link className="btn btn-primary" to="/library">Перейти к покупкам</Link></div>
          </div>
        )}
        {data.status === 'cancelled' && <div className="stack" style={{ gap: 12 }}><p className="muted">Заказ отменён.</p><div><Link className="btn" to="/">В каталог</Link></div></div>}
      </section>
    </div>
  )
}
