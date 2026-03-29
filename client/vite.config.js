// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://fitmitra-f6moul5up-borrious21s-projects.vercel.app/',
        changeOrigin: true,
      }
    }
  }
})