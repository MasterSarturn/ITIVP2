import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// Страница и фильтры живут в query string, поэтому список можно обновить или отправить ссылкой
export function usePagedList(fetcher, filterKeys = []) {
  const [params, setParams] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: null, data: null })
  const [version, setVersion] = useState(0)

  const page = Number(params.get('page')) || 1
  const filters = Object.fromEntries(filterKeys.map((key) => [key, params.get(key) ?? '']))
  const requestKey = JSON.stringify([page, filters, version])

  useEffect(() => {
    let cancelled = false
    setState((current) => ({ ...current, loading: true, error: null }))
    fetcher({ page, ...filters })
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch((error) => !cancelled && setState({ loading: false, error: error.message, data: null }))
    return () => {
      cancelled = true
    }
    // fetcher стабилен, остальное зашито в requestKey
  }, [requestKey])

  const setFilter = useCallback((name, value) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(name, value)
      else next.delete(name)
      next.delete('page')
      return next
    }, { replace: true })
  }, [setParams])

  const setPage = useCallback((value) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value > 1) next.set('page', String(value))
      else next.delete('page')
      return next
    })
  }, [setParams])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return { ...state, page, filters, setFilter, setPage, reload }
}

// Одноразовая загрузка (карточки, справочники)
export function useLoad(loader, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((current) => ({ ...current, loading: true, error: null }))
    loader()
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch((error) => !cancelled && setState({ loading: false, error: error.message, data: null }))
    return () => {
      cancelled = true
    }
  }, [...deps, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  return { ...state, reload }
}
