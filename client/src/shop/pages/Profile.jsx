import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../api/shop'
import { useAuth } from '../../auth/AuthContext'
import { ConfirmDialog, ErrorNote, useToast } from '../../ui/Feedback'
import { TextField } from '../../ui/Field'

// Общий каркас формы: ошибка сервера под полями, тост при успехе
function useSubmit(action, success) {
  const toast = useToast()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await action()
      toast.success(success)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return { submit, error, busy }
}

function NameForm() {
  const { user, updateUser } = useAuth()
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const form = useSubmit(async () => updateUser(await api.profile.update({ firstName: firstName.trim(), lastName: lastName.trim() })), 'Профиль сохранён')

  return (
    <form className="card card-pad stack" style={{ gap: 14 }} onSubmit={form.submit}>
      <h2>Личные данные</h2>
      <div className="form-grid">
        <TextField label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <TextField label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <ErrorNote message={form.error} />
      <div><button className="btn btn-primary" disabled={form.busy}>Сохранить</button></div>
    </form>
  )
}

function EmailForm() {
  const { user, adoptTokens } = useAuth()
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const form = useSubmit(async () => {
    const tokens = await api.profile.changeEmail({ email: email.trim(), currentPassword })
    await adoptTokens(tokens.accessToken)
    setCurrentPassword('')
  }, 'Email изменён')

  return (
    <form className="card card-pad stack" style={{ gap: 14 }} onSubmit={form.submit}>
      <h2>Email</h2>
      <div className="form-grid">
        <TextField label="Новый email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Текущий пароль" type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <ErrorNote message={form.error} />
      <div><button className="btn btn-primary" disabled={form.busy}>Изменить email</button></div>
    </form>
  )
}

function PasswordForm() {
  const { adoptTokens } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const form = useSubmit(async () => {
    const tokens = await api.profile.changePassword({ currentPassword, newPassword })
    await adoptTokens(tokens.accessToken)
    setCurrentPassword('')
    setNewPassword('')
  }, 'Пароль изменён')

  return (
    <form className="card card-pad stack" style={{ gap: 14 }} onSubmit={form.submit}>
      <h2>Пароль</h2>
      <div className="form-grid">
        <TextField label="Текущий пароль" type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <TextField label="Новый пароль" type="password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="Не менее 6 символов" />
      </div>
      <ErrorNote message={form.error} />
      <div><button className="btn btn-primary" disabled={form.busy}>Изменить пароль</button></div>
    </form>
  )
}

export default function Profile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="narrow stack">
      <h1>Профиль</h1>
      <NameForm />
      <EmailForm />
      <PasswordForm />
      <section className="card card-pad stack" style={{ gap: 12 }}>
        <h2>Удаление аккаунта</h2>
        <p className="muted">Аккаунт будет закрыт, а опубликованные вами товары — архивированы.</p>
        <div><button className="btn btn-danger" onClick={() => setConfirm(true)}>Удалить аккаунт</button></div>
      </section>
      {confirm && (
        <ConfirmDialog
          danger
          title="Удалить аккаунт?"
          text="Это действие нельзя отменить."
          confirmLabel="Удалить"
          onConfirm={async () => {
            await api.profile.remove()
            toast.success('Аккаунт удалён')
            await logout()
            navigate('/')
          }}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  )
}
