import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api/admin'
import { usePagedList } from '../hooks/usePagedList'
import DataTable, { SearchInput, SelectFilter } from '../ui/DataTable'
import { PageHead } from '../ui/Feedback'
import Icon from '../ui/Icon'
import StatusBadge, { STATUS_OPTIONS } from '../ui/StatusBadge'
import { formatDate, formatMoney, fullName } from '../utils/format'

export default function Products() {
  const navigate = useNavigate()
  const list = usePagedList(api.products.list, ['status', 'q', 'sellerId'])

  const columns = [
    {
      key: 'name',
      header: 'Товар',
      render: (p) => (
        <>
          <div className="cell-title">{p.name}</div>
          <div className="cell-sub">{p.authors.map((a) => a.name).join(', ') || 'Автор не указан'}</div>
        </>
      ),
    },
    { key: 'category', header: 'Категория', render: (p) => p.category?.name ?? '—' },
    { key: 'seller', header: 'Продавец', render: (p) => fullName(p.seller) },
    { key: 'status', header: 'Статус', render: (p) => <StatusBadge kind="product" value={p.status} /> },
    { key: 'price', header: 'Цена, BYN', className: 'right', render: (p) => <span className="mono">{formatMoney(p.price)}</span> },
    { key: 'created', header: 'Создан', className: 'nowrap', render: (p) => formatDate(p.createdAt) },
  ]

  return (
    <>
      <PageHead
        title="Товары"
        subtitle="Все товары магазина во всех статусах"
        actions={<Link className="btn btn-primary" to="/admin/products/new"><Icon name="plus" />Новый товар</Link>}
      />
      <div className="card">
        <div className="toolbar">
          <SearchInput value={list.filters.q} onChange={(v) => list.setFilter('q', v)} placeholder="Поиск по названию" />
          <SelectFilter label="Все статусы" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUS_OPTIONS.product} />
          {list.filters.sellerId && (
            <button className="btn btn-sm" onClick={() => list.setFilter('sellerId', '')}>Продавец ✕</button>
          )}
        </div>
        <DataTable columns={columns} list={list} onRowClick={(p) => navigate(`/admin/products/${p.id}`)} emptyText="Товаров нет" />
      </div>
    </>
  )
}
