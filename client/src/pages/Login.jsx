import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ErrorNote } from '../ui/Feedback'
import { TextField } from '../ui/Field'
import BrandMark from '../ui/BrandMark'

// Единый вход: /admin/login ведёт в админку, /login возвращает покупателя туда, откуда он пришёл
export default function Login() {
  const { status, user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const adminMode = location.pathname.startsWith('/admin')
  const next = params.get('next')
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null

  const targetFor = (role) => {
    if (adminMode) return role === 'admin' ? location.state?.from ?? '/admin' : '/'
    return safeNext ?? (role === 'admin' ? '/admin' : '/')
  }

  if (status === 'authed') return <Navigate to={targetFor(user.role)} replace />

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const profile = await login(email, password)
      navigate(targetFor(profile.role), { replace: true })
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
          <h1>{adminMode ? 'Вход в админку' : 'Вход'}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {adminMode ? 'Только для администраторов магазина.' : 'Войдите, чтобы покупать и скачивать файлы.'}
          </p>
        </div>
        <TextField label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Пароль" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <ErrorNote message={error} />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
        {!adminMode && (
          <p className="muted">
            Нет аккаунта? <Link to={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : '/register'}>Зарегистрироваться</Link>
          </p>
        )}
        <Link to="/" className="muted">← В магазин</Link>
      </form>
    </div>
  )
}
