import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { seller } from '../api/seller'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeContext'
import { ErrorNote, useToast } from '../ui/Feedback'
import Icon from '../ui/Icon'
import SidebarToggle from '../ui/SidebarToggle'
import { fullName } from '../utils/format'
import { BRAND } from '../brand'
import BrandMark from '../ui/BrandMark'

const NAV = [
  { to: '/seller', label: 'Обзор', icon: 'dashboard', end: true },
  { to: '/seller/products', label: 'Мои товары', icon: 'box' },
  { to: '/seller/sales', label: 'Продажи', icon: 'receipt' },
]

function BecomeSeller() {
  const { adoptTokens, logout } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function become() {
    setBusy(true)
    setError(null)
    try {
      const { accessToken } = await seller.become()
      await adoptTokens(accessToken)
      toast.success('Теперь вы продавец: можно добавлять товары')
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="card login-card stack" style={{ gap: 14 }}>
        <h1>Стать продавцом</h1>
        <p className="muted">
          Продавайте свои цифровые товары: загружайте файлы, публикуйте их в каталоге и следите за продажами.
          Роль можно получить сразу, без заявки.
        </p>
        <ErrorNote message={error} />
        <button className="btn btn-primary" onClick={become} disabled={busy}>{busy ? 'Подождите…' : 'Стать продавцом'}</button>
        <NavLink className="btn" to="/">В магазин</NavLink>
        <button className="link-btn" onClick={logout}>Выйти</button>
      </div>
    </div>
  )
}

// Кабинет продавца: доступен ролям seller и admin; обычному пользователю предлагается стать продавцом
export default function SellerLayout() {
  const { status, user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [location.pathname])

  if (status === 'loading') return <div className="login muted">Загрузка…</div>
  if (status === 'anon') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (user.role !== 'seller' && user.role !== 'admin') return <BecomeSeller />

  return (
    <div className="shell">
      <SidebarToggle open={open} onToggle={() => setOpen((value) => !value)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <BrandMark />
          <div>
            <div className="brand-name">{BRAND}</div>
            <div className="brand-sub">Кабинет продавца</div>
          </div>
        </div>
        <nav className="nav" aria-label="Разделы">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/"><Icon name="store" />В магазин</NavLink>
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <strong>{fullName(user) === '—' ? user.email : fullName(user)}</strong>
            <span>{user.email}</span>
          </div>
          <button className="btn btn-ghost" onClick={toggle}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            <Icon name="logout" />
            Выйти
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
