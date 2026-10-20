import { CATEGORIES } from '../data/mockProducts'

export default function ProductForm({ form, setForm, isEditing, onSubmit, onCancel }) {
  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>{isEditing ? 'Редактирование товара' : 'Новый товар'}</h2>
      <input placeholder="Название" value={form.name} onChange={change('name')} />
      <select value={form.category} onChange={change('category')}>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <input placeholder="Автор" value={form.author} onChange={change('author')} />
      <input type="number" min="0" step="0.01" placeholder="Цена" value={form.price} onChange={change('price')} />
      <input type="number" min="0" step="1" placeholder="Количество" value={form.stockQuantity} onChange={change('stockQuantity')} />
      <div className="row">
        <button type="submit">{isEditing ? 'Сохранить' : 'Добавить'}</button>
        {isEditing && <button type="button" className="secondary" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  )
}
