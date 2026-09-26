import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps asset paths relative so the build works on GitHub Pages
// (https://<user>.github.io/GAMAN-repo/) without hard-coding the repo name.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
