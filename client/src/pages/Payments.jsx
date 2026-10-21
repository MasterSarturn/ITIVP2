import { useNavigate } from 'react-router-dom'
import * as api from '../api/admin'
import { usePagedList } from '../hooks/usePagedList'
import DataTable, { SelectFilter } from '../ui/DataTable'
import { PageHead } from '../ui/Feedback'
import StatusBadge, { STATUS_OPTIONS } from '../ui/StatusBadge'
import { formatDateTime, formatMoney, shortId } from '../utils/format'

export default function Payments() {
  const navigate = useNavigate()
  const list = usePagedList(api.payments.list, ['status', 'orderId'])

  const columns = [
    { key: 'id', header: 'Платёж', render: (p) => <span className="mono">{shortId(p.id)}</span> },
    { key: 'order', header: 'Заказ', render: (p) => <span className="mono">{shortId(p.orderId)}</span> },
    { key: 'status', header: 'Статус', render: (p) => <StatusBadge kind="payment" value={p.status} /> },
    { key: 'provider', header: 'Провайдер', render: (p) => p.provider },
    { key: 'external', header: 'ID у провайдера', render: (p) => <span className="mono">{p.externalPaymentId ?? '—'}</span> },
    { key: 'amount', header: 'Сумма, BYN', className: 'right', render: (p) => <span className="mono">{formatMoney(p.amount)}</span> },
    { key: 'paid', header: 'Оплачен', className: 'nowrap', render: (p) => formatDateTime(p.paidAt) },
    { key: 'created', header: 'Создан', className: 'nowrap', render: (p) => formatDateTime(p.createdAt) },
  ]

  return (
    <>
      <PageHead title="Платежи" subtitle="Платёжные операции по заказам (только просмотр)" />
      <div className="card">
        <div className="toolbar">
          <SelectFilter label="Все статусы" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUS_OPTIONS.payment} />
          {list.filters.orderId && (
            <button className="btn btn-sm" onClick={() => list.setFilter('orderId', '')}>
              Заказ {shortId(list.filters.orderId)} ✕
            </button>
          )}
        </div>
        <DataTable columns={columns} list={list} onRowClick={(p) => navigate(`/admin/orders/${p.orderId}`)} emptyText="Платежей нет" />
      </div>
    </>
  )
}
