import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../../api/shop'
import { useShop } from '../../state/ShopContext'
import { ConfirmDialog, useToast } from '../../ui/Feedback'
import Icon from '../../ui/Icon'
import { Cover, Empty, Price, Totals } from '../components/parts'

// Один промокод на заказ: применённый код показывается с кнопкой «Убрать», причина отказа - под полем
function PromoBox({ cart, onChange }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function apply(event) {
    event.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setError(null)
    try {
      await api.cart.applyPromo(code.trim())
      setCode('')
      await onChange()
      toast.success('Промокод применён')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await api.cart.removePromo()
      await onChange()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (cart.promo) {
    return (
      <div className="stack" style={{ gap: 6 }}>
        <div className="promo-applied">
          <span>Промокод <strong className="mono">{cart.promo.code}</strong></span>
          <button className="link-btn" onClick={remove} disabled={busy}>Убрать</button>
        </div>
        {cart.promoProblem && <div className="alert danger" role="alert">{cart.promoProblem}. Скидка не применяется.</div>}
      </div>
    )
  }

  return (
    <form className="stack" style={{ gap: 6 }} onSubmit={apply}>
      <div className="promo-form">
        <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Промокод" aria-label="Промокод" maxLength={32} />
        <button className="btn" disabled={busy || !code.trim()}>Применить</button>
      </div>
      {error && <div className="field-hint" role="alert" style={{ color: 'var(--danger)' }}>{error}</div>}
    </form>
  )
}

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
          <PromoBox cart={cart} onChange={reloadCart} />
          <Totals subtotal={cart.subtotalAmount} discount={cart.discountAmount} total={cart.totalAmount} promoCode={cart.promo?.code} />
          <button className="btn btn-primary" disabled={busy || unavailable.length > 0 || Boolean(cart.promoProblem)} onClick={checkout}>
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
