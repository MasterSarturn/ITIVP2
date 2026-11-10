import { del, get, post, put, request } from './http'

export const seller = {
  stats: (days) => get('/api/seller/stats', { days }),
  sales: (params) => get('/api/seller/sales', params),
  products: (params) => get('/api/products/mine', params),
  // Возвращает новую пару токенов: роль лежит в JWT
  become: () => request('/profile/become-seller', { method: 'POST' }),
  // Черновики карточек товаров (MongoDB)
  drafts: {
    list: (params) => get('/api/seller/drafts', params),
    create: (body) => post('/api/seller/drafts', body),
    update: (id, body) => put(`/api/seller/drafts/${id}`, body),
    remove: (id) => del(`/api/seller/drafts/${id}`),
  },
}
