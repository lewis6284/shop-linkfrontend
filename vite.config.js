import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/accounting-app/',
  plugins: [react()],
  build: {
    outDir: '../accounting-app/public',
    emptyOutDir: true,
  },
})
