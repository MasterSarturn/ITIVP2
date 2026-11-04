import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../../api/shop'
import { useAuth } from '../../auth/AuthContext'
import { useLoad } from '../../hooks/usePagedList'
import { useShop } from '../../state/ShopContext'
import { ErrorNote, Skeleton, useToast } from '../../ui/Feedback'
import { TextField } from '../../ui/Field'
import Icon from '../../ui/Icon'
import { formatDate, formatSize, fullName } from '../../utils/format'
import { Cover, Empty, Price, Stars } from '../components/parts'

export function Files({ productId, orderItemId }) {
  const toast = useToast()
  const files = useLoad(() => api.catalog.files(productId), [productId])
  const [busy, setBusy] = useState(null)

  async function download(file) {
    setBusy(file.id)
    try {
      await api.downloadFile(orderItemId, file.id, file.fileName)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (files.error) return <ErrorNote message={files.error} onRetry={files.reload} />
  if (!files.data) return <Skeleton height={60} />
  return (
    <ul className="file-list">
      {files.data.map((file) => (
        <li key={file.id}>
          <div>
            <strong>{file.fileName}</strong>
            <div className="muted">{formatSize(file.fileSize)}{file.version ? ` · версия ${file.version}` : ''}</div>
          </div>
          <button className="btn btn-primary btn-sm" disabled={busy === file.id} onClick={() => download(file)}>
            <Icon name="download" />{busy === file.id ? 'Загрузка…' : 'Скачать'}
          </button>
        </li>
      ))}
    </ul>
  )
}

function ReviewForm({ productId, mine, onSaved }) {
  const toast = useToast()
  const [rating, setRating] = useState(mine?.rating ?? 5)
  const [text, setText] = useState(mine?.text ?? '')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const body = { rating, text: text.trim() }
      if (mine) await api.reviews.update(mine.id, body)
      else await api.reviews.create(productId, body)
      toast.success('Отзыв сохранён')
      onSaved()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack review-form" style={{ gap: 12 }} onSubmit={submit}>
      <h3>{mine ? 'Ваш отзыв' : 'Оставить отзыв'}</h3>
      <div className="chips" role="radiogroup" aria-label="Оценка">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} role="radio" aria-checked={rating === n} className={`chip ${rating === n ? 'on' : ''}`} onClick={() => setRating(n)}>{n} ★</button>
        ))}
      </div>
      <TextField label="Комментарий" multiline value={text} onChange={(e) => setText(e.target.value)} />
      <div><button className="btn btn-primary" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</button></div>
    </form>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const shop = useShop()
  const product = useLoad(() => api.catalog.product(id), [id])
  const reviews = useLoad(() => api.listAll((params) => api.reviews.list(id, params)), [id])

  if (product.error) {
    return <div className="stack"><Link to="/">← В каталог</Link><ErrorNote message={product.error} onRetry={product.reload} /></div>
  }
  if (!product.data) return <Skeleton height={360} />

  const item = product.data
  const purchase = shop.purchase(item.id)
  const own = Boolean(user) && item.seller?.id === user.id
  const list = reviews.data ?? []
  const mine = user ? list.find((review) => review.userId === user.id) : undefined
  const average = list.length ? list.reduce((sum, review) => sum + review.rating, 0) / list.length : 0

  return (
    <div className="stack">
      <Link to="/" className="muted">← В каталог</Link>
      <div className="product-page">
        <Cover product={item} large zoom />
        <div className="stack" style={{ gap: 16 }}>
          <div>
            <span className="product-cat">{item.category?.name}</span>
            <h1>{item.name}</h1>
            <p className="muted">
              {item.authors?.length > 0 && <>Автор: {item.authors.map((a) => a.name).join(', ')} · </>}
              Продавец: {fullName(item.seller)}
            </p>
          </div>
          {list.length > 0 && <Stars value={average} count={list.length} />}
          <p className="description">{item.description}</p>
          <Price value={item.price} big />
          <div className="row">
            {purchase ? (
              <span className="badge ok">Куплено</span>
            ) : own ? (
              <span className="badge accent">Ваш товар</span>
            ) : shop.inCart(item.id) ? (
              <Link className="btn btn-primary" to="/cart"><Icon name="cart" />Перейти в корзину</Link>
            ) : (
              <button className="btn btn-primary" onClick={() => shop.addToCart(item.id)}><Icon name="cart" />В корзину</button>
            )}
            <button className={`btn ${shop.inWishlist(item.id) ? 'on' : ''}`} onClick={() => shop.toggleWish(item.id)} aria-pressed={shop.inWishlist(item.id)}>
              <Icon name="heart" />{shop.inWishlist(item.id) ? 'В избранном' : 'В избранное'}
            </button>
          </div>
        </div>
      </div>

      {purchase && (
        <section className="card">
          <div className="card-head"><h2>Файлы</h2></div>
          <div className="card-pad"><Files productId={item.id} orderItemId={purchase.orderItemId} /></div>
        </section>
      )}

      <section className="card">
        <div className="card-head"><h2>Отзывы</h2></div>
        <div className="card-pad stack" style={{ gap: 20 }}>
          <ErrorNote message={reviews.error} onRetry={reviews.reload} />
          {reviews.data && list.length === 0 && <Empty title="Отзывов пока нет" />}
          {list.map((review) => (
            <div key={review.id} className="review">
              <div className="row"><strong>{fullName(review.user)}</strong><Stars value={review.rating} /><span className="muted">{formatDate(review.createdAt)}</span></div>
              {review.text && <p>{review.text}</p>}
            </div>
          ))}
          {purchase && !own && <ReviewForm key={mine?.id ?? 'new'} productId={item.id} mine={mine} onSaved={reviews.reload} />}
        </div>
      </section>
    </div>
  )
}
