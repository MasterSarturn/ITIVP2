import { useState, useEffect, useMemo } from 'react'
import { mockProducts, CATEGORIES } from '../data/mockProducts'
import ProductForm from './ProductForm'
import ProductList from './ProductList'
import Stats from './Stats'

const STORAGE_KEY = 'products'
const emptyForm = { name: '', category: 'book', author: '', price: '', stockQuantity: '' }

export default function ProductManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('none')
  const [isLoading, setIsLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [savedAt, setSavedAt] = useState(null)

  // Загрузка при монтировании: имитация сервера (1 с), затем localStorage или моки
  useEffect(() => {
    const timer = setTimeout(() => {
      let data = mockProducts
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) data = JSON.parse(raw)
      } catch {
        data = mockProducts
      }
      setItems(data)
      setLoaded(true)
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Сохранение при каждом изменении items с debounce 500 мс
  useEffect(() => {
    if (!loaded) return
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      setSavedAt(new Date())
    }, 500)
    return () => clearTimeout(timer)
  }, [items, loaded])

  // Заголовок страницы
  useEffect(() => {
    document.title = loaded ? `Магазин (${items.length} товаров)` : 'Магазин (загрузка…)'
  }, [items.length, loaded])

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    const result = items.filter(
      (p) =>
        (categoryFilter === 'all' || p.category === categoryFilter) &&
        p.name.toLowerCase().includes(q),
    )
    if (sortOrder === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sortOrder === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sortOrder === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    return result
  }, [items, categoryFilter, search, sortOrder])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const price = Number(form.price)
    const stockQuantity = Number(form.stockQuantity || 0)
    if (!form.name.trim()) return setError('Введите название товара')
    if (form.price === '' || Number.isNaN(price) || price < 0) return setError('Цена должна быть числом ≥ 0')
    if (Number.isNaN(stockQuantity) || stockQuantity < 0) return setError('Количество должно быть ≥ 0')

    const product = {
      name: form.name.trim(),
      category: form.category,
      author: form.author.trim(),
      price,
      stockQuantity: Math.floor(stockQuantity),
    }
    if (editingId === null) {
      setItems((prev) => [...prev, { id: Date.now(), ...product }])
    } else {
      setItems((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...product } : p)))
    }
    resetForm()
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setError('')
    setForm({
      name: product.name,
      category: product.category,
      author: product.author,
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
    })
  }

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
    if (editingId === id) resetForm()
  }

  if (isLoading) return <p className="loading">Загрузка данных с сервера…</p>

  return (
    <div className="layout">
      <h1>Магазин цифровых товаров</h1>
      <p className="muted">
        {savedAt ? `Сохранено в ${savedAt.toLocaleTimeString('ru-RU')}` : 'Изменений пока нет'}
      </p>

      <ProductForm
        form={form}
        setForm={setForm}
        isEditing={editingId !== null}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />
      {error && <p className="error">{error}</p>}

      <Stats items={items} />

      <div className="card row filters">
        <input placeholder="Поиск по названию" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Все категории</option>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="none">Без сортировки</option>
          <option value="price-asc">Цена ↑</option>
          <option value="price-desc">Цена ↓</option>
          <option value="name">Название А–Я</option>
        </select>
      </div>

      <ProductList products={visibleItems} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  )
}
