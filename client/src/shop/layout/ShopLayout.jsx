import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useShop } from '../../state/ShopContext'
import { useTheme } from '../../theme/ThemeContext'
import Icon from '../../ui/Icon'
import '../../styles/shop.css'

function SearchBox() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [text, setText] = useState(location.pathname === '/' ? params.get('q') ?? '' : '')

  function submit(event) {
    event.preventDefault()
    const q = text.trim()
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <form className="search" role="search" onSubmit={submit}>
      <Icon name="search" />
      <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Поиск товаров" aria-label="Поиск товаров" />
    </form>
  )
}

export default function ShopLayout() {
  const { status, user, logout } = useAuth()
  const { cartCount, wishIds } = useShop()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const [menu, setMenu] = useState(false)

  useEffect(() => setMenu(false), [location.pathname])

  const name = user && ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email)

  return (
    <div className="shop">
      <header className="shop-header">
        <div className="shop-bar">
          <Link to="/" className="shop-brand"><span className="brand-mark">Ц</span><span>Цифровой магазин</span></Link>
          <SearchBox />
          <nav className="shop-actions" aria-label="Основное меню">
            <button className="icon-btn" onClick={toggle} aria-label="Сменить тему"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
            <Link className="icon-btn badge-host" to="/wishlist" aria-label="Избранное">
              <Icon name="heart" />
              {wishIds.length > 0 && <span className="count">{wishIds.length}</span>}
            </Link>
            <Link className="icon-btn badge-host" to="/cart" aria-label="Корзина">
              <Icon name="cart" />
              {cartCount > 0 && <span className="count">{cartCount}</span>}
            </Link>
            {status === 'authed' ? (
              <div className="user-menu">
                <button className="btn" onClick={() => setMenu((open) => !open)} aria-expanded={menu}><Icon name="user" /><span className="user-name">{name}</span></button>
                {menu && (
                  <div className="menu card" role="menu">
                    <NavLink to="/library">Мои покупки</NavLink>
                    <NavLink to="/orders">Заказы</NavLink>
                    <NavLink to="/profile">Профиль</NavLink>
                    {user.role === 'admin' && <NavLink to="/admin">Админка</NavLink>}
                    <button onClick={logout}>Выйти</button>
                  </div>
                )}
              </div>
            ) : status === 'anon' ? (
              <>
                <Link className="btn" to="/login">Войти</Link>
                <Link className="btn btn-primary hide-sm" to="/register">Регистрация</Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="shop-main"><Outlet /></main>
      <footer className="shop-footer muted">Цифровой магазин · цены в BYN</footer>
    </div>
  )
}
