import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://fitmitra-f6moul5up-borrious21s-projects.vercel.app/', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})