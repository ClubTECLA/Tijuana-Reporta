import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // El backend no tiene CORS: en desarrollo /api se reenvía a Go quitando el prefijo, igual que nginx en producción.
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
    // Las fotos de los reportes no las sirve Go sino nginx (puerto 80 de docker compose), leyendo el volumen.
    '/multimedia': 'http://localhost',
  },
},
})
