import ProductItem from './ProductItem'

export default function ProductList({ products, onEdit, onDelete }) {
  if (products.length === 0) return <p className="muted">Товаров не найдено.</p>
  return (
    <ul className="list">
      {products.map((p) => (
        <ProductItem key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  )
}
