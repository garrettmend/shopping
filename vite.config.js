import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
