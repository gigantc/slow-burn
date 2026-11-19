//////////////////////////////////////
// Vite config (client)

import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Light theme values: keep in sync with `panel` and `chrome` in $theme-light (src/client/scss/_variables.scss).
const BACKGROUND_COLOR = '#f4ecdc';
const THEME_COLOR = '#f8d3a8';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.PORT ?? '3100';

  return {
    root: 'src/client',
    publicDir: resolve(import.meta.dirname, 'public'),
    envDir: import.meta.dirname,
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, 'src/client'),
        shared: resolve(import.meta.dirname, 'src/shared'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: { loadPaths: [resolve(import.meta.dirname, 'src/client')] },
      },
    },
    build: {
      outDir: resolve(import.meta.dirname, 'dist/client'),
      emptyOutDir: true,
    },
    server: {
      proxy: { '/api': `http://127.0.0.1:${apiPort}` },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        strategies: 'generateSW',
        manifest: {
          name: 'Slow Burn',
          short_name: 'Slow Burn',
          description: 'Smoke, sip, savor, repeat.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: BACKGROUND_COLOR,
          theme_color: THEME_COLOR,
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff2}'],
          navigateFallback: '/index.html',
          // API calls always go to the network; never serve them from the app shell.
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [{ urlPattern: /^\/api\//, handler: 'NetworkOnly' }],
        },
      }),
    ],
  };
});
