import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // jangan muat ulang otomatis: bisa memutus musik di tengah pelajaran.
      // Guru yang menekan "Muat ulang" saat versi baru tersedia.
      registerType: 'prompt',
      workbox: {
        // seluruh aplikasi + semua sampel suara (±5 MB) disimpan sekaligus,
        // supaya ganti laras/instrumen tetap jalan tanpa internet
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,mp3}'],
        cleanupOutdatedCaches: true,
        // kunjungan pertama langsung dilayani service worker, jadi kalau internet
        // putus sebelum halaman dimuat ulang, suara lain tetap diambil dari cache
        clientsClaim: true,
      },
      manifest: {
        name: 'Nadantara — Gamelan Digital',
        short_name: 'Nadantara',
        description: 'Gamelan digital untuk belajar musik di kelas.',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5eee2',
        theme_color: '#f5eee2',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
