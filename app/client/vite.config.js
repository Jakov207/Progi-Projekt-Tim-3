// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Ovo je konfiguracija proxyja koja oponaša Nginx logiku
    proxy: {
      '/api': {
        // Postavite na port na kojem se vrti vaš LOKALNI Express server
        target: 'http://localhost:8080', 
        changeOrigin: true,
        // OVO je ekvivalent Nginx rewrite direktivi:
        // Uklanja '/api' iz zahtjeva prije slanja na backend
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
