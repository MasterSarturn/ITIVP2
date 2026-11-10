import { useEffect, useState, useSyncExternalStore } from 'react'
import { isServerDown, pingServer, subscribeServerDown } from '../api/http'

const POLL_MS = 5000

function ServerDown() {
  const [checking, setChecking] = useState(false)

  // Как только сервер ответил, перезагружаем страницу: сессия и данные инициализируются заново
  const check = async () => {
    setChecking(true)
    const up = await pingServer()
    if (up) window.location.reload()
    else setChecking(false)
  }

  useEffect(() => {
    const timer = setInterval(async () => {
      if (await pingServer()) window.location.reload()
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="login">
      <div className="card login-card" role="alert">
        <h1>Сервер недоступен</h1>
        <p className="muted">
          Не удалось связаться с сервером. Возможно, он выключен или проводятся технические работы.
          Страница обновится сама, как только соединение восстановится.
        </p>
        <button className="btn btn-primary" onClick={check} disabled={checking}>
          {checking ? 'Проверяем…' : 'Повторить'}
        </button>
      </div>
    </div>
  )
}

// Вместо «Ошибка запроса (502)» в каждом углу интерфейса — одна страница на всё приложение
export default function ServerGate({ children }) {
  const down = useSyncExternalStore(subscribeServerDown, isServerDown)
  return down ? <ServerDown /> : children
}
