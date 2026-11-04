import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

// Просмотр изображения на весь экран: закрывается по Esc, клику по фону и кнопке
export default function Lightbox({ src, alt = '', onClose }) {
  const closeButton = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      // фокус остаётся на единственной кнопке, пока открыт просмотр
      if (event.key === 'Tab') {
        event.preventDefault()
        closeButton.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр изображения" onClick={onClose}>
      <button ref={closeButton} className="lightbox-close" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button>
      <img src={src} alt={alt} onClick={(event) => event.stopPropagation()} />
    </div>,
    document.body,
  )
}
