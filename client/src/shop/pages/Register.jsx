import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ErrorNote } from '../../ui/Feedback'
import { TextField } from '../../ui/Field'
import BrandMark from '../../ui/BrandMark'

export default function Register() {
  const { status, register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const next = params.get('next')
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  if (status === 'authed') return <Navigate to={target} replace />

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
      })
      navigate(target, { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <div>
          <BrandMark style={{ marginBottom: 16 }} />
          <h1>Регистрация</h1>
          <p className="muted" style={{ marginTop: 6 }}>Аккаунт нужен, чтобы покупать товары и скачивать файлы.</p>
        </div>
        <div className="form-grid">
          <TextField label="Имя" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
          <TextField label="Фамилия" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
        </div>
        <TextField label="Email" type="email" autoComplete="username" required value={form.email} onChange={set('email')} />
        <TextField label="Пароль" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={set('password')} hint="Не менее 6 символов" />
        <ErrorNote message={error} />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Создаём…' : 'Создать аккаунт'}</button>
        <p className="muted">Уже есть аккаунт? <Link to={next ? `/login?next=${encodeURIComponent(target)}` : '/login'}>Войти</Link></p>
      </form>
    </div>
  )
}
