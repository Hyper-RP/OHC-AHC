import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Use 'dist' for Vercel (default Vite output)
    // Comment out for local development with Django
    outDir: mode === 'production' ? 'dist' : '../myproject/static/react',
    emptyOutDir: true,
  },
}));