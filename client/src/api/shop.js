import { get, post, patch, del, request } from './http'

export const catalog = {
  products: (params) => get('/api/products', params),
  product: (id) => get(`/api/products/${id}`),
  files: (id) => get(`/api/products/${id}/files`),
  categories: (params) => get('/api/categories', params),
  authors: (params) => get('/api/authors', params),
}

export const cart = {
  get: () => get('/api/cart'),
  add: (productId) => post('/api/cart/items', { productId }),
  remove: (productId) => del(`/api/cart/items/${productId}`),
  clear: () => del('/api/cart'),
}

export const wishlist = {
  list: (params) => get('/api/wishlist', params),
  add: (productId) => post('/api/wishlist', { productId }),
  remove: (productId) => del(`/api/wishlist/${productId}`),
}

export const orders = {
  create: () => post('/api/orders'),
  list: (params) => get('/api/orders', params),
  get: (id) => get(`/api/orders/${id}`),
  cancel: (id) => post(`/api/orders/${id}/cancel`),
  payments: (id) => get(`/api/orders/${id}/payments`),
  pay: (id) => post(`/api/orders/${id}/payments`),
  // только вне production: имитация ответа платёжного провайдера
  simulate: (paymentId, status) => post(`/api/dev/payments/${paymentId}/simulate`, { status }),
}

export const reviews = {
  list: (productId, params) => get(`/api/products/${productId}/reviews`, params),
  create: (productId, body) => post(`/api/products/${productId}/reviews`, body),
  update: (id, body) => patch(`/api/reviews/${id}`, body),
  remove: (id) => del(`/api/reviews/${id}`),
}

export const profile = {
  update: (body) => patch('/profile', body),
  changePassword: (body) => patch('/profile/password', body),
  changeEmail: (body) => patch('/profile/email', body),
  remove: () => del('/profile'),
}

export async function listAll(fetchPage) {
  const items = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    const data = await fetchPage({ page })
    items.push(...data.items)
    totalPages = data.totalPages
    page += 1
  }
  return items
}

// Файл отдаётся только с Bearer, поэтому скачиваем в blob и отдаём браузеру временную ссылку
export async function downloadFile(orderItemId, productFileId, fileName) {
  const grant = await post('/api/downloads', { orderItemId, productFileId })
  const response = await request(`/api/downloads/${grant.id}/content`, { raw: true })
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
