import { useNavigate } from 'react-router-dom'
import * as api from '../api/admin'
import { usePagedList } from '../hooks/usePagedList'
import DataTable, { SearchInput, SelectFilter } from '../ui/DataTable'
import { PageHead } from '../ui/Feedback'
import StatusBadge, { STATUS_OPTIONS } from '../ui/StatusBadge'
import { formatDateTime, fullName } from '../utils/format'

export default function Users() {
  const navigate = useNavigate()
  const list = usePagedList(api.users.list, ['status', 'role', 'q'])

  const columns = [
    {
      key: 'user',
      header: 'Пользователь',
      render: (u) => (
        <>
          <div className="cell-title">{fullName(u)}</div>
          <div className="cell-sub">{u.email}</div>
        </>
      ),
    },
    { key: 'role', header: 'Роль', render: (u) => <StatusBadge kind="role" value={u.role} /> },
    { key: 'status', header: 'Статус', render: (u) => <StatusBadge kind="account" value={u.status} /> },
    { key: 'login', header: 'Последний вход', className: 'nowrap', render: (u) => formatDateTime(u.lastLoginAt) },
    { key: 'created', header: 'Регистрация', className: 'nowrap', render: (u) => formatDateTime(u.createdAt) },
  ]

  return (
    <>
      <PageHead title="Пользователи" subtitle="Аккаунты, роли и блокировки" />
      <div className="card">
        <div className="toolbar">
          <SearchInput value={list.filters.q} onChange={(v) => list.setFilter('q', v)} placeholder="Имя, фамилия или email" />
          <SelectFilter label="Все роли" value={list.filters.role} onChange={(v) => list.setFilter('role', v)} options={STATUS_OPTIONS.role} />
          <SelectFilter label="Все статусы" value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUS_OPTIONS.account} />
        </div>
        <DataTable columns={columns} list={list} onRowClick={(u) => navigate(`/admin/users/${u.id}`)} emptyText="Пользователи не найдены" />
      </div>
    </>
  )
}
