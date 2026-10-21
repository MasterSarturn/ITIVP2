import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../../api/shop'
import { useShop } from '../../state/ShopContext'
import { ConfirmDialog, useToast } from '../../ui/Feedback'
import Icon from '../../ui/Icon'
import { formatMoney } from '../../utils/format'
import { Cover, Empty, Price } from '../components/parts'

export default function Cart() {
  const { cart, removeFromCart, reloadCart, reloadPurchases } = useShop()
  const toast = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const unavailable = cart.items.filter((item) => !item.available)

  async function checkout() {
    setBusy(true)
    try {
      const order = await api.orders.create()
      await reloadCart()
      // бесплатный заказ сервер сразу помечает оплаченным
      if (order.status === 'paid') {
        await reloadPurchases()
        toast.success('Заказ оформлен, файлы доступны в «Моих покупках»')
        navigate(`/orders/${order.id}`)
      } else {
        navigate(`/checkout/${order.id}`)
      }
    } catch (e) {
      toast.error(e.message)
      reloadCart().catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  if (cart.items.length === 0) {
    return <Empty title="Корзина пуста" text="Добавьте товары из каталога." action={<Link className="btn btn-primary" to="/">В каталог</Link>} />
  }

  return (
    <div className="stack">
      <h1>Корзина</h1>
      <div className="cart-layout">
        <section className="card">
          <ul className="line-list">
            {cart.items.map((item) => (
              <li key={item.productId} className={item.available ? '' : 'off'}>
                <Cover product={item.product} />
                <div className="line-main">
                  <Link to={`/products/${item.productId}`}><strong>{item.product.name}</strong></Link>
                  {!item.available && <div className="muted">Товар недоступен — удалите его, чтобы оформить заказ</div>}
                </div>
                <Price value={item.product.price} />
                <button className="icon-btn" onClick={() => removeFromCart(item.productId)} aria-label={`Удалить «${item.product.name}»`}><Icon name="trash" /></button>
              </li>
            ))}
          </ul>
        </section>
        <aside className="card card-pad summary">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Товаров: {cart.items.length}</span>
            <button className="link-btn" onClick={() => setConfirmClear(true)}>Очистить</button>
          </div>
          <div className="summary-total"><span>Итого</span><strong>{formatMoney(cart.totalAmount)} <small>BYN</small></strong></div>
          <button className="btn btn-primary" disabled={busy || unavailable.length > 0} onClick={checkout}>
            {busy ? 'Оформляем…' : 'Оформить заказ'}
          </button>
        </aside>
      </div>
      {confirmClear && (
        <ConfirmDialog
          danger
          title="Очистить корзину?"
          text="Все товары будут удалены из корзины."
          confirmLabel="Очистить"
          onConfirm={async () => { await api.cart.clear(); await reloadCart() }}
          onClose={() => setConfirmClear(false)}
        />
      )}
    </div>
  )
}
