import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the API is proxied, so the app always calls a same-origin "/api" and needs no
// CORS round trip. In production, point VITE_API_BASE_URL at the deployed backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // reachable from a phone on the same wifi for real-device testing
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
