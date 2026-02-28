import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api-proxy': {
        target: 'https://spotty-con-ivaniks-3f8c7802.koyeb.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, '')
      }
    }
  }
})
