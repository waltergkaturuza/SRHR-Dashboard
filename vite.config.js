import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to handle SPA routing - fixes refresh 404 issue
    {
      name: 'spa-fallback',
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res, next) => {
            // If request is for a file (has extension), let it through
            if (req.url && req.url.includes('.')) {
              return next()
            }
            // Otherwise, serve index.html for all routes (SPA fallback)
            req.url = '/index.html'
            next()
          })
        }
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  }
})

