import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { BRAND } from '../../brand'
import { useDismiss } from '../../hooks/useDismiss'
import { useShop } from '../../state/ShopContext'
import { useTheme } from '../../theme/ThemeContext'
import BrandMark from '../../ui/BrandMark'
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
  const menuRef = useRef(null)
  const closeMenu = useCallback(() => setMenu(false), [])

  // меню закрывается кликом вне него, Escape и выбором пункта (в том числе ссылки на текущую страницу)
  useDismiss(menuRef, menu, closeMenu)

  useEffect(() => setMenu(false), [location.pathname])

  const name = user && ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email)

  return (
    <div className="shop">
      <header className="shop-header">
        <div className="shop-bar">
          <Link to="/" className="shop-brand"><BrandMark /><span>{BRAND}</span></Link>
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
              <div className="user-menu" ref={menuRef}>
                <button className="btn" onClick={() => setMenu((open) => !open)} aria-expanded={menu}><Icon name="user" /><span className="user-name">{name}</span></button>
                {menu && (
                  <div className="menu card" role="menu" onClick={(event) => { if (event.target.closest('a, button')) closeMenu() }}>
                    <NavLink to="/" end>В магазин</NavLink>
                    <NavLink to="/library">Мои покупки</NavLink>
                    <NavLink to="/orders">Заказы</NavLink>
                    <NavLink to="/profile">Профиль</NavLink>
                    <NavLink to="/about">О нас</NavLink>
                    <NavLink to="/seller">{user.role === 'user' ? 'Стать продавцом' : 'Кабинет продавца'}</NavLink>
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
      <footer className="shop-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="shop-brand"><BrandMark /><span>{BRAND}</span></Link>
            <p className="muted">Цифровые товары. Современные решения. Удобные покупки.</p>
            <nav className="footer-links" aria-label="Разделы">
              <Link to="/">В магазин</Link>
              <Link to="/about">О нас</Link>
            </nav>
          </div>
          <section className="requisites" aria-labelledby="requisites-title">
            <h2 id="requisites-title">Реквизиты</h2>
            <dl>
              <div><dt>Название магазина</dt><dd>{BRAND}</dd></div>
              <div><dt>Страна</dt><dd>Республика Беларусь</dd></div>
              <div><dt>Год основания</dt><dd>2025</dd></div>
              <div><dt>Директор</dt><dd>Горбачевский Илья</dd></div>
            </dl>
          </section>
          <section className="requisites" aria-labelledby="contacts-title">
            <h2 id="contacts-title">Контакты</h2>
            <dl>
              <div><dt>Город</dt><dd>Минск</dd></div>
              <div><dt>Почтовый индекс</dt><dd>220020</dd></div>
              <div><dt>Телефон поддержки</dt><dd><a href="tel:+375330456967">+375 33 045-69-67</a></dd></div>
            </dl>
          </section>
        </div>
        <div className="footer-bottom">
          <span>© 2025 {BRAND}</span>
          <span>Цены указаны в BYN</span>
        </div>
      </footer>
    </div>
  )
}
