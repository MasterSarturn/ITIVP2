import { useEffect } from 'react'

// Закрывает выпадающий блок по клику вне ref и по Escape; пока он закрыт, слушатели не висят
export function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return undefined

    function onPointer(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose()
    }
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, onClose])
}
