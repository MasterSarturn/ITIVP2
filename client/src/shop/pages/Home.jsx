import { useEffect, useState } from 'react'
import * as api from '../../api/shop'
import { usePagedList, useLoad } from '../../hooks/usePagedList'
import { useShop } from '../../state/ShopContext'
import { ErrorNote, Skeleton } from '../../ui/Feedback'
import { SelectField, TextField } from '../../ui/Field'
import { Empty, Pager, ProductCard } from '../components/parts'

const FILTERS = ['q', 'categorySlug', 'authorId', 'sort', 'minPrice', 'maxPrice']
const SORTS = [
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'rating', label: 'По рейтингу' }
]

// Цена применяется после паузы в наборе, чтобы не слать запрос на каждую цифру
function PriceInput({ label, value, onCommit }) {
  const [text, setText] = useState(value)

  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return undefined
    const timer = setTimeout(() => onCommit(text), 450)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <TextField
      label={label}
      type="number"
      min="0"
      step="1"
      inputMode="decimal"
      className="price-field"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  )
}

export default function Home() {
  const { inWishlist, toggleWish } = useShop()
  const list = usePagedList(api.catalog.products, FILTERS)
  const refs = useLoad(async () => {
    const [categories, authors] = await Promise.all([api.listAll(api.catalog.categories), api.listAll(api.catalog.authors)])
    return { categories, authors }
  }, [])

  const { filters, setFilter } = list
  const hasFilters = FILTERS.some((key) => filters[key])

  return (
    <div className="stack">
      <section className="hero">
        <h1>Цифровые товары — сразу после оплаты</h1>
        <p>Шаблоны, курсы, книги и графика. Купите и скачайте файлы в личном кабинете.</p>
      </section>

      <div className="filters">
        <div className="chips" role="group" aria-label="Категории">
          <button className={`chip ${!filters.categorySlug ? 'on' : ''}`} onClick={() => setFilter('categorySlug', '')}>Все</button>
          {refs.data?.categories.map((category) => (
            <button key={category.id} className={`chip ${filters.categorySlug === category.slug ? 'on' : ''}`} aria-pressed={filters.categorySlug === category.slug} onClick={() => setFilter('categorySlug', category.slug)}>
              {category.name}
            </button>
          ))}
        </div>
        <div className="filter-controls">
          <SelectField
            label="Автор"
            value={filters.authorId}
            onChange={(e) => setFilter('authorId', e.target.value)}
            placeholder="Все авторы"
            options={(refs.data?.authors ?? []).map((a) => ({ value: a.id, label: a.name }))}
          />
          <SelectField
            label="Сортировка"
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            placeholder="Сначала новые"
            options={SORTS}
          />
          <PriceInput label="Цена от, BYN" value={filters.minPrice} onCommit={(v) => setFilter('minPrice', v)} />
          <PriceInput label="до, BYN" value={filters.maxPrice} onCommit={(v) => setFilter('maxPrice', v)} />
        </div>
      </div>

      {filters.q && (
        <p className="muted">Результаты по запросу «{filters.q}» · <button className="link-btn" onClick={() => setFilter('q', '')}>сбросить</button></p>
      )}

      <ErrorNote message={list.error} onRetry={list.reload} />
      {list.loading && !list.data ? (
        <div className="product-grid">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} height={280} />)}</div>
      ) : list.data && (
        list.data.items.length === 0 ? (
          <Empty
            title={hasFilters ? 'Ничего не найдено' : 'Каталог пока пуст'}
            text={hasFilters ? 'Попробуйте изменить запрос или снять фильтры.' : 'Загляните позже.'}
            action={hasFilters && <button className="btn" onClick={() => FILTERS.forEach((key) => setFilter(key, ''))}>Сбросить фильтры</button>}
          />
        ) : (
          <>
            <div className="product-grid">
              {list.data.items.map((product) => (
                <ProductCard key={product.id} product={product} wished={inWishlist(product.id)} onWish={toggleWish} />
              ))}
            </div>
            <Pager data={list.data} onPage={list.setPage} />
          </>
        )
      )}
    </div>
  )
}
