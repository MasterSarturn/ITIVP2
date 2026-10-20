import { CATEGORIES } from '../data/mockProducts'

export default function Stats({ items }) {
  const total = items.length
  const outOfStock = items.filter((p) => p.stockQuantity === 0).length
  const totalValue = items.reduce((sum, p) => sum + p.price * p.stockQuantity, 0)

  return (
    <div className="card stats">
      <h2>Статистика</h2>
      <p>Всего товаров: <b>{total}</b></p>
      <p>В наличии: <b>{total - outOfStock}</b> · Нет в наличии: <b>{outOfStock}</b></p>
      <p>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <span key={key} className="tag">
            {label}: {items.filter((p) => p.category === key).length}
          </span>
        ))}
      </p>
      <p>Стоимость склада: <b>{totalValue.toFixed(2)} $</b></p>
    </div>
  )
}
