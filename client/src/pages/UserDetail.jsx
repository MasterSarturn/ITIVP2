import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as api from '../api/admin'
import { useAuth } from '../auth/AuthContext'
import { useLoad } from '../hooks/usePagedList'
import { ConfirmDialog, ErrorNote, Modal, PageHead, Skeleton, useToast } from '../ui/Feedback'
import { SelectField, TextField } from '../ui/Field'
import StatusBadge, { STATUS_OPTIONS } from '../ui/StatusBadge'
import { formatDateTime, fullName } from '../utils/format'

function NameDialog({ user, onSaved, onClose }) {
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.users.update(user.id, { firstName, lastName })
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Изменить имя"
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" form="name-form" disabled={busy}>Сохранить</button>
        </>
      )}
    >
      <form id="name-form" className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <TextField label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <TextField label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <ErrorNote message={error} />
      </form>
    </Modal>
  )
}

function RoleDialog({ user, onSaved, onClose }) {
  const [role, setRole] = useState(user.role)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await api.users.setRole(user.id, role)
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Сменить роль"
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || role === user.role}>Сохранить</button>
        </>
      )}
    >
      <SelectField label="Роль" value={role} onChange={(e) => setRole(e.target.value)} options={STATUS_OPTIONS.role} />
      <p className="field-hint">После смены роли все сессии пользователя завершатся, ему придётся войти заново.</p>
      <ErrorNote message={error} />
    </Modal>
  )
}

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user: me } = useAuth()
  const [dialog, setDialog] = useState(null)
  const { data: user, loading, error, reload } = useLoad(() => api.users.get(id), [id])

  const back = <div className="crumbs"><Link to="/admin/users">← Пользователи</Link></div>

  if (error) return <><PageHead title="Пользователь" back={back} /><ErrorNote message={error} onRetry={reload} /></>
  if (loading && !user) return <><PageHead title="Пользователь" back={back} /><Skeleton height={240} /></>

  const isSelf = user.id === me.id
  const isDeleted = user.status === 'deleted'
  const blocked = user.status === 'blocked'
  const saved = (message) => () => {
    toast.success(message)
    reload()
  }

  return (
    <div className="stack">
      <PageHead
        back={back}
        title={fullName(user) === '—' ? user.email : fullName(user)}
        subtitle={user.email}
        actions={!isDeleted && (
          <>
            <button className="btn" onClick={() => setDialog('name')}>Изменить имя</button>
            <button className="btn" onClick={() => setDialog('role')} disabled={isSelf}>Сменить роль</button>
            <button className="btn btn-danger" onClick={() => setDialog('status')} disabled={isSelf}>
              {blocked ? 'Разблокировать' : 'Заблокировать'}
            </button>
            <button className="btn btn-danger" onClick={() => setDialog('delete')} disabled={isSelf}>Удалить</button>
          </>
        )}
      />

      {isSelf && <div className="alert info">Это ваша учётная запись: менять собственные роль и статус нельзя.</div>}
      {isDeleted && <div className="alert">Пользователь удалён. Вернуть аккаунт через API нельзя.</div>}

      <div className="grid-2">
        <section className="card card-pad">
          <h3 style={{ marginBottom: 14 }}>Аккаунт</h3>
          <dl className="kv">
            <dt>Роль</dt><dd><StatusBadge kind="role" value={user.role} /></dd>
            <dt>Статус</dt><dd><StatusBadge kind="account" value={user.status} /></dd>
            <dt>Последний вход</dt><dd>{formatDateTime(user.lastLoginAt)}</dd>
            <dt>Регистрация</dt><dd>{formatDateTime(user.createdAt)}</dd>
            <dt>Неудачных входов</dt><dd>{user.failedLoginAttempts}</dd>
            {user.lockUntil && new Date(user.lockUntil) > new Date() && (
              <><dt>Временная блокировка</dt><dd>до {formatDateTime(user.lockUntil)}</dd></>
            )}
          </dl>
        </section>
        <section className="card card-pad">
          <h3 style={{ marginBottom: 14 }}>Связанные данные</h3>
          <div className="stack" style={{ gap: 10 }}>
            <Link to={`/admin/orders?userId=${user.id}`}>Заказы пользователя</Link>
            <Link to={`/admin/downloads?userId=${user.id}`}>Скачивания пользователя</Link>
            {(user.role === 'seller' || user.role === 'admin') && <span className="muted">Товары продавца доступны в разделе «Товары».</span>}
          </div>
        </section>
      </div>

      {dialog === 'name' && <NameDialog user={user} onSaved={saved('Имя обновлено')} onClose={() => setDialog(null)} />}
      {dialog === 'role' && <RoleDialog user={user} onSaved={saved('Роль изменена')} onClose={() => setDialog(null)} />}
      {dialog === 'status' && (
        <ConfirmDialog
          danger={!blocked}
          title={blocked ? 'Разблокировать пользователя?' : 'Заблокировать пользователя?'}
          text={blocked
            ? 'Пользователь снова сможет войти в систему.'
            : 'Сессии пользователя будут завершены, вход станет невозможен до разблокировки.'}
          confirmLabel={blocked ? 'Разблокировать' : 'Заблокировать'}
          onConfirm={async () => {
            await api.users.setStatus(user.id, blocked ? 'active' : 'blocked')
            saved(blocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован')()
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'delete' && (
        <ConfirmDialog
          danger
          title="Удалить пользователя?"
          text="Аккаунт будет помечен удалённым, его товары уйдут в архив, неоплаченные заказы отменятся. Действие необратимо."
          confirmLabel="Удалить"
          onConfirm={async () => {
            await api.users.remove(user.id)
            toast.success('Пользователь удалён')
            navigate('/admin/users')
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
