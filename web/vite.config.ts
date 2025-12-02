import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acceso desde la red local
    port: 5174,
    watch: {
      // Usar polling para Docker en Windows (detecta cambios de archivos)
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      // Hot Module Replacement
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  base: '/',
})
