import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../../state/ShopContext'
import { formatDate } from '../../utils/format'
import { Cover, Empty } from '../components/parts'
import { Files } from './ProductPage'

export default function Library() {
  const { purchases } = useShop()
  const [open, setOpen] = useState(null)

  if (purchases.length === 0) {
    return <Empty title="Покупок пока нет" text="Оплаченные товары и их файлы появятся здесь." action={<Link className="btn btn-primary" to="/">В каталог</Link>} />
  }

  return (
    <div className="stack">
      <h1>Мои покупки</h1>
      <section className="card">
        <ul className="line-list">
          {purchases.map((item) => (
            <li key={item.orderItemId} className="block">
              <div className="line-row">
                <Cover product={item.product} />
                <div className="line-main">
                  <Link to={`/products/${item.product.id}`}><strong>{item.product.name}</strong></Link>
                  <div className="muted">Оплачен {formatDate(item.paidAt)} · <Link to={`/orders/${item.orderId}`}>заказ</Link></div>
                </div>
                <button className="btn btn-sm" aria-expanded={open === item.orderItemId} onClick={() => setOpen(open === item.orderItemId ? null : item.orderItemId)}>
                  {open === item.orderItemId ? 'Скрыть файлы' : 'Файлы'}
                </button>
              </div>
              {open === item.orderItemId && <Files productId={item.product.id} orderItemId={item.orderItemId} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
