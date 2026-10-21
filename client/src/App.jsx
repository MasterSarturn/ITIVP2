import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import AdminLayout from './layout/AdminLayout'
import Catalog from './pages/Catalog'
import Dashboard from './pages/Dashboard'
import Downloads from './pages/Downloads'
import Login from './pages/Login'
import OrderDetail from './pages/OrderDetail'
import Orders from './pages/Orders'
import Payments from './pages/Payments'
import ProductEdit from './pages/ProductEdit'
import Products from './pages/Products'
import UserDetail from './pages/UserDetail'
import Users from './pages/Users'
import ShopLayout from './shop/layout/ShopLayout'
import Cart from './shop/pages/Cart'
import Checkout from './shop/pages/Checkout'
import Home from './shop/pages/Home'
import Library from './shop/pages/Library'
import NotFound from './shop/pages/NotFound'
import { MyOrders, OrderPage } from './shop/pages/Orders'
import ProductPage from './shop/pages/ProductPage'
import Profile from './shop/pages/Profile'
import Register from './shop/pages/Register'
import Wishlist from './shop/pages/Wishlist'
import { ShopProvider } from './state/ShopContext'
import { ThemeProvider } from './theme/ThemeContext'
import ErrorBoundary from './ui/ErrorBoundary'
import { ToastProvider } from './ui/Feedback'

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ShopProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/new" element={<ProductEdit />} />
                  <Route path="products/:id" element={<ProductEdit />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="users" element={<Users />} />
                  <Route path="users/:id" element={<UserDetail />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="downloads" element={<Downloads />} />
                  <Route path="catalog" element={<Catalog />} />
                </Route>
                <Route element={<ShopLayout />}>
                  <Route index element={<Home />} />
                  <Route path="products/:id" element={<ProductPage />} />
                  <Route element={<RequireAuth />}>
                    <Route path="cart" element={<Cart />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="checkout/:orderId" element={<Checkout />} />
                    <Route path="orders" element={<MyOrders />} />
                    <Route path="orders/:id" element={<OrderPage />} />
                    <Route path="library" element={<Library />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ShopProvider>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
