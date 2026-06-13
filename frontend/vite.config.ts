import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Use relative paths for built assets (critical for Django serving)
  base: mode === 'production' ? './' : '/',

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
    // Build output directory configuration:
    // - Production mode (npm run build): outputs to 'dist/'
    //   GitHub Actions copies dist/ to myproject/static/react/
    // - Development mode (npm run dev --debug): outputs to '../myproject/static/react'
    //   Useful for local testing with Django serving the built files
    outDir: mode === 'production' ? 'dist' : '../myproject/static/react',
    emptyOutDir: true,
  },
}));
