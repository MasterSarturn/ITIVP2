import { useNavigate } from 'react-router-dom'
import * as api from '../api/admin'
import { usePagedList } from '../hooks/usePagedList'
import DataTable, { SelectFilter } from '../ui/DataTable'
import ExportButton from '../ui/ExportButton'
import { PageHead } from '../ui/Feedback'
import StatusBadge, { STATUS_OPTIONS } from '../ui/StatusBadge'
import { formatDateTime, formatMoney, fullName, shortId } from '../utils/format'

export default function Orders() {
  const navigate = useNavigate()
  const list = usePagedList(api.orders.list, ['status', 'userId'])

  const columns = [
    { key: 'id', header: 'Заказ', render: (o) => <span className="mono">{shortId(o.id)}</span> },
    {
      key: 'buyer',
      header: 'Покупатель',
      render: (o) => (
        <>
          <div className="cell-title">{fullName(o.user)}</div>
          <div className="cell-sub">{o.user?.account?.email}</div>
        </>
      ),
    },
    {
      key: 'items',
      header: 'Состав',
      render: (o) => (
        <>
          <div>{o.items.map((item) => item.product?.name).filter(Boolean).slice(0, 2).join(', ')}</div>
          {o.items.length > 2 && <div className="cell-sub">и ещё {o.items.length - 2}</div>}
        </>
      ),
    },
    { key: 'status', header: 'Статус', render: (o) => <StatusBadge kind="order" value={o.status} /> },
    { key: 'total', header: 'Сумма, BYN', className: 'right', render: (o) => <span className="mono">{formatMoney(o.totalAmount)}</span> },
    { key: 'created', header: 'Создан', className: 'nowrap', render: (o) => formatDateTime(o.createdAt) },
  ]

  return (
    <>
      <PageHead
        title="Заказы"
        subtitle="Все заказы магазина"
        actions={<ExportButton path="/api/admin/orders/export.csv" params={list.filters} fileName="orders.csv" />}
      />
      <div className="card">
        <div className="toolbar">
          <SelectFilter label="Все статусы" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUS_OPTIONS.order} />
          {list.filters.userId && (
            <button className="btn btn-sm" onClick={() => list.setFilter('userId', '')}>
              Покупатель {shortId(list.filters.userId)} ✕
            </button>
          )}
        </div>
        <DataTable columns={columns} list={list} onRowClick={(o) => navigate(`/admin/orders/${o.id}`)} emptyText="Заказов нет" />
      </div>
    </>
  )
}
