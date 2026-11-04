import { useState } from 'react'
import { useImageSrc } from '../../hooks/useImageSrc'
import Lightbox from '../../ui/Lightbox'
import { Link } from 'react-router-dom'
import Icon from '../../ui/Icon'
import { formatMoney } from '../../utils/format'

// Без загруженной картинки обложка — градиент, оттенок которого зависит от id
function hue(id = '') {
  let sum = 0
  for (const char of id) sum = (sum * 31 + char.charCodeAt(0)) % 360
  return sum
}

export function Cover({ product, large, zoom }) {
  const [failed, setFailed] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const h = hue(product.id)
  const style = { background: `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${(h + 50) % 360} 65% 45%))` }
  // картинку неопубликованного товара сервер отдаёт только владельцу и админу, для неё нужен токен
  const { src, failed: loadFailed } = useImageSrc(product.imageUrl, Boolean(product.status) && product.status !== 'published')
  const showImage = Boolean(src) && !failed && !loadFailed
  const cover = (
    <div className={`cover ${large ? 'large' : ''} ${showImage ? 'has-image' : ''}`} style={style} aria-hidden={!(zoom && showImage)}>
      {showImage
        ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
        : <span>{product.name.trim().slice(0, 2).toUpperCase()}</span>}
    </div>
  )

  if (!(zoom && showImage)) return cover

  return (
    <>
      <button type="button" className="cover-zoom" onClick={() => setZoomed(true)} aria-label={`Открыть фото «${product.name}» на весь экран`}>
        {cover}
        <span className="cover-zoom-hint" aria-hidden="true">Открыть</span>
      </button>
      {zoomed && <Lightbox src={src} alt={product.name} onClose={() => setZoomed(false)} />}
    </>
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

// Строки «Товары / Скидка» и итог; скидка показывается, только если она есть
export function Totals({ subtotal, discount, total, promoCode }) {
  const hasDiscount = Number(discount) > 0

  return (
    <div className="stack" style={{ gap: 8 }}>
      {hasDiscount && (
        <>
          <div className="summary-line"><span className="muted">Товары</span><span className="mono">{formatMoney(subtotal)} BYN</span></div>
          <div className="summary-line discount">
            <span>Скидка{promoCode ? ` · ${promoCode}` : ''}</span>
            <span className="mono">−{formatMoney(discount)} BYN</span>
          </div>
        </>
      )}
      <div className="summary-total"><span>Итого</span><strong>{formatMoney(total)} <small>BYN</small></strong></div>
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
