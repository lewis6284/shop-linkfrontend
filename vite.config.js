import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: '/accounting-app/',
  plugins: [react()],
  resolve: {
    alias: {
    },
  },
  build: {
    outDir: '../accounting-app/public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['axios', 'date-fns'],
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          'vendor-charts': ['recharts'],
          'vendor-jspdf': ['jspdf', 'jspdf-autotable'],
          'vendor-html2canvas': ['html2canvas'],
        }
      }
    }
  },
})
