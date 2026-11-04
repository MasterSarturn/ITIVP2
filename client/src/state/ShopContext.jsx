import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as api from '../api/shop'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../ui/Feedback'

const ShopContext = createContext(null)

const EMPTY = { cart: { items: [], subtotalAmount: '0.00', discountAmount: '0.00', totalAmount: '0.00', promo: null, promoProblem: null }, wishIds: [], purchases: [] }

// Корзина, избранное и купленное нужны в шапке и на карточках, поэтому живут выше страниц
export function ShopProvider({ children }) {
  const { status } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState(EMPTY)

  const reloadCart = useCallback(async () => {
    const cart = await api.cart.get()
    setState((current) => ({ ...current, cart }))
    return cart
  }, [])

  const reloadWishlist = useCallback(async () => {
    const items = await api.listAll(api.wishlist.list)
    setState((current) => ({ ...current, wishIds: items.map((item) => item.productId) }))
  }, [])

  // Купленное = позиции оплаченных заказов; возврат закрывает доступ, поэтому refunded не считаем
  const reloadPurchases = useCallback(async () => {
    const orders = await api.listAll(api.orders.list)
    const purchases = orders
      .filter((order) => order.status === 'paid')
      .flatMap((order) => order.items.map((item) => ({ orderItemId: item.id, orderId: order.id, paidAt: order.updatedAt, product: item.product })))
    setState((current) => ({ ...current, purchases }))
  }, [])

  useEffect(() => {
    if (status !== 'authed') {
      setState(EMPTY)
      return
    }
    Promise.all([reloadCart(), reloadWishlist(), reloadPurchases()]).catch(() => {})
  }, [status, reloadCart, reloadWishlist, reloadPurchases])

  const requireLogin = useCallback(() => {
    if (status === 'authed') return false
    toast.error('Войдите, чтобы продолжить')
    navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)
    return true
  }, [status, toast, navigate, location])

  const addToCart = useCallback(async (productId) => {
    if (requireLogin()) return false
    try {
      await api.cart.add(productId)
      await reloadCart()
      toast.success('Добавлено в корзину')
      return true
    } catch (e) {
      toast.error(e.message)
      return false
    }
  }, [requireLogin, reloadCart, toast])

  const removeFromCart = useCallback(async (productId) => {
    try {
      await api.cart.remove(productId)
      await reloadCart()
    } catch (e) {
      toast.error(e.message)
    }
  }, [reloadCart, toast])

  const toggleWish = useCallback(async (productId) => {
    if (requireLogin()) return
    const has = state.wishIds.includes(productId)
    try {
      if (has) await api.wishlist.remove(productId)
      else await api.wishlist.add(productId)
      setState((current) => ({
        ...current,
        wishIds: has ? current.wishIds.filter((id) => id !== productId) : [...current.wishIds, productId],
      }))
    } catch (e) {
      toast.error(e.message)
    }
  }, [requireLogin, state.wishIds, toast])

  const value = useMemo(() => ({
    ...state,
    cartCount: state.cart.items.length,
    inCart: (productId) => state.cart.items.some((item) => item.productId === productId),
    inWishlist: (productId) => state.wishIds.includes(productId),
    purchase: (productId) => state.purchases.find((item) => item.product.id === productId),
    reloadCart, reloadWishlist, reloadPurchases, addToCart, removeFromCart, toggleWish,
  }), [state, reloadCart, reloadWishlist, reloadPurchases, addToCart, removeFromCart, toggleWish])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  return useContext(ShopContext)
}
