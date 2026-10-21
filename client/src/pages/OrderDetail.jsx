import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../api/admin'
import { useLoad } from '../hooks/usePagedList'
import { ConfirmDialog, ErrorNote, PageHead, Skeleton, useToast } from '../ui/Feedback'
import StatusBadge from '../ui/StatusBadge'
import { formatDateTime, formatMoney, shortId } from '../utils/format'

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [dialog, setDialog] = useState(null)
  const { data, loading, error, reload } = useLoad(async () => {
    const [order, payments] = await Promise.all([api.orders.get(id), api.orders.payments(id)])
    return { order, payments }
  }, [id])

  const back = <div className="crumbs"><Link to="/admin/orders">← Заказы</Link></div>

  if (error) return <><PageHead title="Заказ" back={back} /><ErrorNote message={error} onRetry={reload} /></>
  if (loading && !data) return <><PageHead title="Заказ" back={back} /><Skeleton height={240} /></>

  const { order, payments } = data

  async function act(action, message) {
    await action(order.id)
    toast.success(message)
    reload()
  }

  const actions = (
    <>
      {order.status === 'pending' && (
        <button className="btn btn-danger" onClick={() => setDialog('cancel')}>Отменить заказ</button>
      )}
      {order.status === 'paid' && (
        <button className="btn btn-danger" onClick={() => setDialog('refund')}>Оформить возврат</button>
      )}
    </>
  )

  return (
    <div className="stack">
      <PageHead
        back={back}
        title={`Заказ ${shortId(order.id)}`}
        subtitle={`Создан ${formatDateTime(order.createdAt)}`}
        actions={actions}
      />

      <div className="grid-sidebar">
        <section className="card">
          <div className="card-head"><h2>Состав заказа</h2><StatusBadge kind="order" value={order.status} /></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Товар</th><th className="right">Цена на момент покупки, BYN</th></tr></thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td><Link to={`/admin/products/${item.productId}`}>{item.product?.name ?? item.productId}</Link></td>
                    <td className="right mono">{formatMoney(item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><b>Итого</b></td>
                  <td className="right mono"><b>{formatMoney(order.totalAmount)}</b></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="card card-pad">
          <h3 style={{ marginBottom: 12 }}>Покупатель</h3>
          <dl className="kv" style={{ gridTemplateColumns: '90px 1fr' }}>
            <dt>ID</dt>
            <dd><Link className="mono" to={`/admin/users/${order.userId}`}>{shortId(order.userId)}</Link></dd>
            <dt>Заказы</dt>
            <dd><Link to={`/admin/orders?userId=${order.userId}`}>Все заказы покупателя</Link></dd>
            <dt>Скачивания</dt>
            <dd><Link to={`/admin/downloads?userId=${order.userId}`}>Открыть</Link></dd>
          </dl>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Платежи</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Платёж</th><th>Статус</th><th>Провайдер</th><th className="right">Сумма, BYN</th><th>Оплачен</th></tr></thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="mono">{shortId(payment.id)}</td>
                  <td><StatusBadge kind="payment" value={payment.status} /></td>
                  <td>{payment.provider}</td>
                  <td className="right mono">{formatMoney(payment.amount)}</td>
                  <td className="nowrap">{formatDateTime(payment.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="empty">
              <strong>Платежей нет</strong>
              <span>{Number(order.totalAmount) === 0 ? 'Заказ бесплатный, платёж не требуется.' : 'Покупатель ещё не начал оплату.'}</span>
            </div>
          )}
        </div>
      </section>

      {dialog === 'refund' && (
        <ConfirmDialog
          danger
          title="Оформить возврат?"
          text="Заказ перейдёт в статус «Возврат», платежи будут помечены возвращёнными, а доступ покупателя к скачиванию закроется."
          confirmLabel="Оформить возврат"
          onConfirm={() => act(api.orders.refund, 'Возврат оформлен')}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'cancel' && (
        <ConfirmDialog
          danger
          title="Отменить заказ?"
          text="Неоплаченный заказ будет отменён. Покупатель сможет оформить его заново."
          confirmLabel="Отменить заказ"
          onConfirm={() => act(api.orders.cancel, 'Заказ отменён')}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
