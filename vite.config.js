import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// Encaminha /api para o servidor do formulário (server/index.js)
const apiProxy = { '/api': 'http://127.0.0.1:3001' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    allowedHosts: [
      'euthiago.com',
    ],
    proxy: apiProxy,
  },
  preview: {
    allowedHosts: [
      'euthiago.com',
    ],
    proxy: apiProxy,
  },
})
