import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = 'http://localhost:3000'

// Клиент ходит на тот же origin, поэтому cookie с refresh-токеном работает без CORS
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': target,
      '/auth': target,
      '/profile': target,
    },
  },
})
