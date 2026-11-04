import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeContext'
import Icon from '../ui/Icon'
import SidebarToggle from '../ui/SidebarToggle'
import { fullName } from '../utils/format'
import { BRAND } from '../brand'
import BrandMark from '../ui/BrandMark'

const NAV = [
  { to: '/admin', label: 'Обзор', icon: 'dashboard', end: true },
  { to: '/admin/products', label: 'Товары', icon: 'box' },
  { to: '/admin/orders', label: 'Заказы', icon: 'receipt' },
  { to: '/admin/users', label: 'Пользователи', icon: 'users' },
  { to: '/admin/payments', label: 'Платежи', icon: 'card' },
  { to: '/admin/promo-codes', label: 'Промокоды', icon: 'tag' },
  { to: '/admin/downloads', label: 'Скачивания', icon: 'download' },
  { to: '/admin/catalog', label: 'Справочники', icon: 'tag' },
]

function Splash() {
  return <div className="login muted">Загрузка…</div>
}

function Forbidden() {
  const { logout } = useAuth()
  return (
    <div className="login">
      <div className="card login-card">
        <h1>Нет доступа</h1>
        <p className="muted">У этой учётной записи нет прав администратора. Войдите под другой записью.</p>
        <button className="btn btn-primary" onClick={logout}>Выйти</button>
      </div>
    </div>
  )
}

// Всё внутри /admin, кроме входа, доступно только роли admin
export default function AdminLayout() {
  const { status, user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [location.pathname])

  if (status === 'loading') return <Splash />
  if (status === 'anon') return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  if (user.role !== 'admin') return <Forbidden />

  return (
    <div className="shell">
      <SidebarToggle open={open} onToggle={() => setOpen((value) => !value)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <BrandMark />
          <div>
            <div className="brand-name">{BRAND}</div>
            <div className="brand-sub">Админ-панель</div>
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
