import { get, request } from './http'

export const seller = {
  stats: (days) => get('/api/seller/stats', { days }),
  sales: (params) => get('/api/seller/sales', params),
  products: (params) => get('/api/products/mine', params),
  // Возвращает новую пару токенов: роль лежит в JWT
  become: () => request('/profile/become-seller', { method: 'POST' }),
}
