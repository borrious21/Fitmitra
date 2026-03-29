// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://fitmitra-fyp.netlify.app',
        changeOrigin: true,
      }
    }
  }
})