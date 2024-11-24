import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

/* Konfiguration von Vite für ein Vue-Projekt inklusive PWA-Plugin */
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Webhook Bot',
        short_name: 'App',
        theme_color: '#4DBA87',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/img/icons/chat-bot_11773927.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/img/icons/chat-bot_11773927.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // An optional area to customize the Workbox behavior if needed
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});