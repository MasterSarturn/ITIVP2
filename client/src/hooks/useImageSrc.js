import { useEffect, useState } from 'react'
import { request } from '../api/http'

// <img src> не умеет отправлять Bearer, а черновик сервер отдаёт только владельцу и администратору.
// Для таких картинок (auth) файл запрашивается с токеном и показывается через временную ссылку blob:
export function useImageSrc(url, auth) {
  const [loaded, setLoaded] = useState({ url: null, src: null, failed: false })

  useEffect(() => {
    if (!auth || !url) return undefined
    let cancelled = false
    let objectUrl = null

    request(url, { raw: true })
      .then((response) => response.blob())
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setLoaded({ url, src: objectUrl, failed: false })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ url, src: null, failed: true })
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, auth])

  if (!auth || !url) return { src: url || null, failed: false }
  if (loaded.url !== url) return { src: null, failed: false } // ещё грузится
  return { src: loaded.src, failed: loaded.failed }
}
