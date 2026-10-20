import { CATEGORIES } from '../data/mockProducts'

export default function ProductItem({ product, onEdit, onDelete }) {
  const inStock = product.stockQuantity > 0
  return (
    <li className="item">
      <div>
        <strong>{product.name}</strong>
        <div className="muted">
          {CATEGORIES[product.category]} · {product.author || 'автор не указан'}
        </div>
        <div className={inStock ? 'ok' : 'bad'}>
          {inStock ? `В наличии: ${product.stockQuantity}` : 'Нет в наличии'}
        </div>
      </div>
      <div className="side">
        <span className="price">{product.price.toFixed(2)} $</span>
        <button className="secondary" onClick={() => onEdit(product)}>Редактировать</button>
        <button className="danger" onClick={() => onDelete(product.id)}>Удалить</button>
      </div>
    </li>
  )
}
