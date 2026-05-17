import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Added to force Vite Dev Server to restart and clear PostCSS error cache
export default defineConfig({
  plugins: [react()],
})
