// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        // Port 5173 je zadan, ali ga možete ovdje osigurati
        port: 5173,
        proxy: {
            // Svi zahtjevi koji počinju s '/api' bit će preusmjereni
            '/api': {
                target: 'http://localhost:3001', // Backend server on port 3001
                changeOrigin: true,
                secure: false,
            },
        },
    },
})