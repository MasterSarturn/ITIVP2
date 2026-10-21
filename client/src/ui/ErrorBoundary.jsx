import { Component } from 'react'

// Без границы ошибка отрисовки оставляет пустую белую страницу
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Ошибка отрисовки:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="login">
        <div className="card login-card">
          <h1>Что-то пошло не так</h1>
          <p className="muted">Страница не смогла отрисоваться. Подробности есть в консоли браузера (F12).</p>
          <pre className="mono" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(error?.message ?? error)}</pre>
          <button className="btn btn-primary" onClick={() => { window.location.href = '/' }}>Перезагрузить</button>
        </div>
      </div>
    )
  }
}
