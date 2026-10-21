import { useEffect, useState } from 'react'
import { Skeleton } from './Feedback'

export function Pagination({ data, page, onPage }) {
  if (!data) return null
  const { totalItems, totalPages } = data
  return (
    <div className="table-foot">
      <span>{totalItems === 0 ? 'Нет записей' : `Всего: ${totalItems}`}</span>
      {totalPages > 1 && (
        <div className="pager">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Назад</button>
          <span>{page} из {totalPages}</span>
          <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Вперёд</button>
        </div>
      )}
    </div>
  )
}

// columns: [{ key, header, render(row), className }]
export default function DataTable({ columns, list, onRowClick, emptyText = 'Ничего не найдено' }) {
  const { data, loading, error, page, setPage } = list
  const rows = data?.items ?? []

  return (
    <>
      {error && <div className="alert danger" style={{ margin: 16 }}>{error}</div>}
      <div className="table-wrap" aria-busy={loading}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key} className={column.className}>{column.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && !data && Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                {columns.map((column) => <td key={column.key}><Skeleton height={16} /></td>)}
              </tr>
            ))}
            {rows.map((row) => (
              <tr
                key={row.id}
                className={onRowClick ? 'clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={loading ? { opacity: 0.55 } : undefined}
              >
                {columns.map((column) => <td key={column.key} className={column.className}>{column.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !error && rows.length === 0 && (
          <div className="empty"><strong>{emptyText}</strong><span>Измените фильтры или добавьте записи.</span></div>
        )}
      </div>
      <Pagination data={data} page={page} onPage={setPage} />
    </>
  )
}

// Поле поиска с задержкой, чтобы не слать запрос на каждую букву
export function SearchInput({ value, onChange, placeholder = 'Поиск' }) {
  const [text, setText] = useState(value)

  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return undefined
    const timer = setTimeout(() => onChange(text.trim()), 350)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <input
      className="input search"
      type="search"
      value={text}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event) => setText(event.target.value)}
    />
  )
}

export function SelectFilter({ value, onChange, options, label }) {
  return (
    <select className="select" value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
}
