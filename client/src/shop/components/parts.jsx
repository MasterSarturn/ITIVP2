import { Link } from 'react-router-dom'
import Icon from '../../ui/Icon'
import { formatMoney } from '../../utils/format'

// Картинок у товаров в API нет: обложка — градиент, оттенок которого зависит от id
function hue(id = '') {
  let sum = 0
  for (const char of id) sum = (sum * 31 + char.charCodeAt(0)) % 360
  return sum
}

export function Cover({ product, large }) {
  const h = hue(product.id)
  const style = { background: `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${(h + 50) % 360} 65% 45%))` }
  return (
    <div className={`cover ${large ? 'large' : ''}`} style={style} aria-hidden="true">
      <span>{product.name.trim().slice(0, 2).toUpperCase()}</span>
    </div>
  )
}

export function Price({ value, big }) {
  if (Number(value) === 0) return <span className={`price ${big ? 'big' : ''}`}>Бесплатно</span>
  return <span className={`price ${big ? 'big' : ''}`}>{formatMoney(value)} <small>BYN</small></span>
}

export function Stars({ value, count }) {
  const rounded = Math.round(value)
  return (
    <span className="stars" aria-label={`Рейтинг ${value.toFixed(1)} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= rounded ? 'on' : ''}><Icon name="star" /></span>)}
      {count !== undefined && <span className="muted"> {value.toFixed(1)} · {count}</span>}
    </span>
  )
}

export function ProductCard({ product, wished, onWish }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-link">
        <Cover product={product} />
        <div className="product-info">
          <span className="product-cat">{product.category?.name}</span>
          <h3>{product.name}</h3>
          <span className="muted product-authors">{product.authors?.map((a) => a.name).join(', ')}</span>
        </div>
      </Link>
      <div className="product-foot">
        <Price value={product.price} />
        <button className={`icon-btn ${wished ? 'on' : ''}`} onClick={() => onWish(product.id)} aria-pressed={wished} aria-label={wished ? 'Убрать из избранного' : 'В избранное'}>
          <Icon name="heart" />
        </button>
      </div>
    </article>
  )
}

export function Pager({ data, onPage }) {
  if (!data || data.totalPages <= 1) return null
  return (
    <div className="pager center">
      <button className="btn" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>← Назад</button>
      <span className="muted">Страница {data.page} из {data.totalPages}</span>
      <button className="btn" disabled={data.page >= data.totalPages} onClick={() => onPage(data.page + 1)}>Вперёд →</button>
    </div>
  )
}

export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {text && <span>{text}</span>}
      {action}
    </div>
  )
}
