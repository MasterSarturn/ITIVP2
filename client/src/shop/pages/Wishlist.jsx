import { Link } from 'react-router-dom'
import * as api from '../../api/shop'
import { useLoad } from '../../hooks/usePagedList'
import { useShop } from '../../state/ShopContext'
import { ErrorNote, Skeleton, useToast } from '../../ui/Feedback'
import Icon from '../../ui/Icon'
import { Cover, Empty, Price } from '../components/parts'

export default function Wishlist() {
  const shop = useShop()
  const toast = useToast()
  const list = useLoad(() => api.listAll(api.wishlist.list), [])

  async function remove(productId) {
    await shop.toggleWish(productId)
    list.reload()
  }

  async function addToCart(productId) {
    if (await shop.addToCart(productId)) {
      await api.wishlist.remove(productId).catch((e) => toast.error(e.message))
      await shop.reloadWishlist()
      list.reload()
    }
  }

  if (list.error) return <ErrorNote message={list.error} onRetry={list.reload} />
  if (!list.data) return <Skeleton height={200} />
  if (list.data.length === 0) {
    return <Empty title="В избранном пусто" text="Отмечайте сердечком товары, к которым хотите вернуться." action={<Link className="btn btn-primary" to="/">В каталог</Link>} />
  }

  return (
    <div className="stack">
      <h1>Избранное</h1>
      <section className="card">
        <ul className="line-list">
          {list.data.map((item) => (
            <li key={item.productId} className={item.available ? '' : 'off'}>
              <Cover product={item.product} />
              <div className="line-main">
                <Link to={`/products/${item.productId}`}><strong>{item.product.name}</strong></Link>
                {!item.available && <div className="muted">Сейчас недоступен</div>}
              </div>
              <Price value={item.product.price} />
              {item.available && !shop.inCart(item.productId) && !shop.purchase(item.productId) && (
                <button className="btn btn-sm" onClick={() => addToCart(item.productId)}><Icon name="cart" />В корзину</button>
              )}
              <button className="icon-btn" onClick={() => remove(item.productId)} aria-label={`Убрать «${item.product.name}» из избранного`}><Icon name="trash" /></button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
