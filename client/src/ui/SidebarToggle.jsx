import Icon from './Icon'

// Кнопка меню узкого экрана: всегда поверх сайдбара (в его углу), в закрытом состоянии остаётся единственным элементом.
// Затемнение закрывает меню по клику вне него.
export default function SidebarToggle({ open, onToggle }) {
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onToggle} aria-hidden="true" />}
      <button className="btn menu-toggle" onClick={onToggle} aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open}>
        <Icon name={open ? 'close' : 'menu'} />
      </button>
    </>
  )
}
