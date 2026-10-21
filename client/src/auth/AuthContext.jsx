import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { get, post, refreshSession, request, setAccessToken, setAuthLostHandler } from '../api/http'

const AuthContext = createContext(null)

// Роли в профиле нет, она лежит только в JWT
function decodeRole(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(payload)))).role
  } catch {
    return null
  }
}

async function loadSession(token) {
  setAccessToken(token)
  const profile = await get('/profile')
  return { ...profile, role: decodeRole(token) }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null })

  useEffect(() => {
    setAuthLostHandler(() => setState({ status: 'anon', user: null }))

    let cancelled = false
    refreshSession()
      .then(loadSession)
      .then((user) => !cancelled && setState({ status: 'authed', user }))
      .catch(() => {
        setAccessToken(null)
        if (!cancelled) setState({ status: 'anon', user: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { accessToken } = await request('/auth/login', { method: 'POST', body: { email, password }, noRefresh: true })
    const user = await loadSession(accessToken)
    setState({ status: 'authed', user })
    return user
  }, [])

  const register = useCallback(async (body) => {
    await request('/auth/register', { method: 'POST', body, noRefresh: true })
    return login(body.email, body.password)
  }, [login])

  // После смены пароля или email сервер выдаёт новую пару токенов
  const adoptTokens = useCallback(async (accessToken) => {
    const user = await loadSession(accessToken)
    setState({ status: 'authed', user })
    return user
  }, [])

  const updateUser = useCallback((patch) => {
    setState((current) => (current.user ? { ...current, user: { ...current.user, ...patch } } : current))
  }, [])

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout')
    } catch {
      // токен мог уже истечь: локально выходим в любом случае
    }
    setAccessToken(null)
    setState({ status: 'anon', user: null })
  }, [])

  const value = useMemo(() => ({ ...state, login, register, adoptTokens, updateUser, logout }), [state, login, register, adoptTokens, updateUser, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
