import { get, post, put, patch, del, request } from './http'

export const stats = (days) => get('/api/admin/stats', { days })

export const users = {
  list: (params) => get('/api/admin/users', params),
  get: (id) => get(`/api/admin/users/${id}`),
  update: (id, body) => patch(`/api/admin/users/${id}`, body),
  setStatus: (id, status) => patch(`/api/admin/users/${id}/status`, { status }),
  setRole: (id, role) => patch(`/api/admin/users/${id}/role`, { role }),
  remove: (id) => del(`/api/admin/users/${id}`),
}

export const products = {
  list: (params) => get('/api/admin/products', params),
  get: (id) => get(`/api/products/${id}`),
  create: (body) => post('/api/products', body),
  update: (id, body) => put(`/api/products/${id}`, body),
  setStatus: (id, status) => patch(`/api/products/${id}/status`, { status }),
  archive: (id) => del(`/api/products/${id}`),
  files: (id) => get(`/api/products/${id}/files`),
  uploadFile: (id, file, version) => {
    const form = new FormData()
    form.append('file', file)
    if (version) form.append('version', version)
    return request(`/api/products/${id}/files`, { method: 'POST', form })
  },
  replaceFile: (id, fileId, file, version) => {
    const form = new FormData()
    form.append('file', file)
    if (version) form.append('version', version)
    return request(`/api/products/${id}/files/${fileId}`, { method: 'PUT', form })
  },
  removeFile: (id, fileId) => del(`/api/products/${id}/files/${fileId}`),
  setImage: (id, image) => {
    const form = new FormData()
    form.append('image', image)
    return request(`/api/products/${id}/image`, { method: 'PUT', form })
  },
  removeImage: (id) => del(`/api/products/${id}/image`),
}

export const orders = {
  list: (params) => get('/api/admin/orders', params),
  get: (id) => get(`/api/orders/${id}`),
  payments: (id) => get(`/api/orders/${id}/payments`),
  refund: (id) => post(`/api/admin/orders/${id}/refund`),
  cancel: (id) => post(`/api/orders/${id}/cancel`),
}

export const payments = { list: (params) => get('/api/admin/payments', params) }
export const downloads = { list: (params) => get('/api/admin/downloads', params) }

export const categories = {
  list: (params) => get('/api/categories', params),
  create: (body) => post('/api/categories', body),
  update: (id, body) => patch(`/api/categories/${id}`, body),
  remove: (id) => del(`/api/categories/${id}`),
}

export const promoCodes = {
  list: (params) => get('/api/admin/promo-codes', params),
  create: (body) => post('/api/admin/promo-codes', body),
  update: (id, body) => patch(`/api/admin/promo-codes/${id}`, body),
  remove: (id) => del(`/api/admin/promo-codes/${id}`),
}

export const authors = {
  list: (params) => get('/api/authors', params),
  create: (body) => post('/api/authors', body),
  update: (id, body) => patch(`/api/authors/${id}`, body),
  remove: (id) => del(`/api/authors/${id}`),
}

// Справочники приходят постранично, а селектам нужен весь список
export async function listAll(resource) {
  const items = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    const data = await resource.list({ page })
    items.push(...data.items)
    totalPages = data.totalPages
    page += 1
  }
  return items
}
