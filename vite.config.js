import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
    manifest: {
      id: '/',
      name: 'PadTalk',
      short_name: 'PadTalk',
      description: 'Understand Thai menus and confidently order like a local.',
      lang: 'en',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#fffbeb',
      theme_color: '#b45309',
      categories: ['food', 'travel', 'education'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,woff2}'],
      navigateFallback: 'index.html',
      cleanupOutdatedCaches: true,
      // No API/photo runtime caching. Only the build's app shell is precached.
      runtimeCaching: [],
    },
    devOptions: { enabled: false },
  })],
})
