import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Keep built asset paths relative for preview and deployed hosting.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
