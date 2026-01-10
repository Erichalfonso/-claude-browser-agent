import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'main.ts',
        vite: {
          build: {
            outDir: '../dist',
            rollupOptions: {
              external: ['electron', 'electron-store', 'puppeteer', 'fs', 'path', 'https', 'http', 'uuid'],
            },
          },
        },
      },
      {
        entry: 'preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: '../dist',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
  ],
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
