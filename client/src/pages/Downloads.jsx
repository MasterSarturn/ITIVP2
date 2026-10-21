import { Link } from 'react-router-dom'
import * as api from '../api/admin'
import { usePagedList } from '../hooks/usePagedList'
import DataTable from '../ui/DataTable'
import { PageHead } from '../ui/Feedback'
import { formatDateTime, shortId } from '../utils/format'

export default function Downloads() {
  const list = usePagedList(api.downloads.list, ['userId', 'productId'])

  const columns = [
    { key: 'file', header: 'Файл', render: (d) => <span className="cell-title">{d.fileName ?? '—'}</span> },
    { key: 'product', header: 'Товар', render: (d) => d.productId ? <Link className="mono" to={`/admin/products/${d.productId}`}>{shortId(d.productId)}</Link> : '—' },
    { key: 'user', header: 'Пользователь', render: (d) => <Link className="mono" to={`/admin/users/${d.userId}`}>{shortId(d.userId)}</Link> },
    { key: 'ip', header: 'IP-адрес', render: (d) => <span className="mono">{d.ipAddress ?? '—'}</span> },
    { key: 'at', header: 'Скачан', className: 'nowrap', render: (d) => formatDateTime(d.downloadedAt) },
  ]

  return (
    <>
      <PageHead title="Скачивания" subtitle="История скачиваний купленных файлов (только просмотр)" />
      <div className="card">
        {(list.filters.userId || list.filters.productId) && (
          <div className="toolbar">
            {list.filters.userId && (
              <button className="btn btn-sm" onClick={() => list.setFilter('userId', '')}>Пользователь {shortId(list.filters.userId)} ✕</button>
            )}
            {list.filters.productId && (
              <button className="btn btn-sm" onClick={() => list.setFilter('productId', '')}>Товар {shortId(list.filters.productId)} ✕</button>
            )}
          </div>
        )}
        <DataTable columns={columns} list={list} emptyText="Скачиваний нет" />
      </div>
    </>
  )
}
