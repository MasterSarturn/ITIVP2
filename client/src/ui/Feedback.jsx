import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export function Skeleton({ height = 20, width = '100%' }) {
  return <div className="skeleton" style={{ height, width }} />
}

export function ErrorNote({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="alert danger">
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Повторить</button>}
    </div>
  )
}

export function PageHead({ title, subtitle, actions, back }) {
  return (
    <div className="page-head">
      <div>
        {back}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

// ---------- Модальные окна ----------

export function Modal({ title, children, footer, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector('input, select, textarea, button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head"><h2>{title}</h2></div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, text, confirmLabel = 'Подтвердить', danger, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Отмена</button>
          <button className={`btn ${danger ? 'btn-danger solid' : 'btn-primary'}`} onClick={submit} disabled={busy}>
            {busy ? 'Выполняется…' : confirmLabel}
          </button>
        </>
      )}
    >
      <p className="muted">{text}</p>
      <ErrorNote message={error} />
    </Modal>
  )
}

// ---------- Уведомления ----------

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID()
    setItems((current) => [...current, { id, message, type }])
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4000)
  }, [])

  const value = useMemo(() => ({ success: (m) => push(m), error: (m) => push(m, 'error') }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((item) => <div key={item.id} className={`toast ${item.type}`}>{item.message}</div>)}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
