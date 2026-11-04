import { Link, useNavigate } from 'react-router-dom'
import { seller } from '../api/seller'
import { usePagedList } from '../hooks/usePagedList'
import DataTable, { SelectFilter } from '../ui/DataTable'
import { PageHead } from '../ui/Feedback'
import Icon from '../ui/Icon'
import StatusBadge, { STATUS_OPTIONS } from '../ui/StatusBadge'
import { formatDate, formatMoney } from '../utils/format'

export default function SellerProducts() {
  const navigate = useNavigate()
  const list = usePagedList(seller.products, ['status'])

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
    { key: 'status', header: 'Статус', render: (p) => <StatusBadge kind="product" value={p.status} /> },
    { key: 'price', header: 'Цена, BYN', className: 'right', render: (p) => <span className="mono">{formatMoney(p.price)}</span> },
    { key: 'created', header: 'Создан', className: 'nowrap', render: (p) => formatDate(p.createdAt) },
  ]

  return (
    <>
      <PageHead
        title="Мои товары"
        subtitle="Товары во всех статусах"
        actions={<Link className="btn btn-primary" to="/seller/products/new"><Icon name="plus" />Новый товар</Link>}
      />
      <div className="card">
        <div className="toolbar">
          <SelectFilter label="Все статусы" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUS_OPTIONS.product} />
        </div>
        <DataTable columns={columns} list={list} onRowClick={(p) => navigate(`/seller/products/${p.id}`)} emptyText="Товаров пока нет" />
      </div>
    </>
  )
}
