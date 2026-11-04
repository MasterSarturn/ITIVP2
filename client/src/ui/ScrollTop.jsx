import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

const SHOW_AFTER = 400 // px прокрутки, после которых кнопка вообще появляется
const HIDE_IDLE = 2000 // мс без прокрутки, после которых кнопка растворяется

// Кнопка «наверх» для любой страницы: видна, пока пользователь листает вниз, и гаснет, когда он замер
export default function ScrollTop() {
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    function onScroll() {
      clearTimeout(timer.current)
      if (window.scrollY < SHOW_AFTER) {
        setVisible(false)
        return
      }
      setVisible(true)
      timer.current = setTimeout(() => setVisible(false), HIDE_IDLE)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer.current)
    }
  }, [])

  function toTop() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  // Исчезнувшая кнопка недоступна и для клавиатуры; при фокусе или наведении она остаётся
  return (
    <button
      type="button"
      className={`scroll-top ${visible ? 'show' : ''}`}
      onClick={toTop}
      onMouseEnter={() => clearTimeout(timer.current)}
      onFocus={() => setVisible(true)}
      aria-label="Наверх"
      title="Наверх"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <Icon name="arrowUp" />
    </button>
  )
}
