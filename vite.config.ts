import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import express from 'express';
import dotenv from 'dotenv';
import apiRouter from './server/api.ts';

dotenv.config();

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(express.json());
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      expressApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'Purpose Talk — Inglês com Louvor e IA',
          short_name: 'Purpose Talk',
          description: 'Aprenda inglês no seu ritmo com 148 louvores, fonética falada e cantada, mentores de IA e carreira tech.',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/?source=pwa',
          lang: 'pt-BR',
          dir: 'ltr',
          categories: ['education', 'music', 'productivity'],
          prefer_related_applications: false,
          screenshots: [
            {
              src: 'og-cover.jpg',
              sizes: '1200x630',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: 'Purpose Talk — Inglês com Louvor, Tecnologia e IA',
            },
          ],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp,webmanifest}'],
          navigateFallbackDenylist: [/^\/api\//, /^\/firebase-messaging-sw\.js$/, /^\/\.well-known\//],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
