import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ThemisScan---ANALISADOR-DE-CONTRATOS-JUR-DICOS/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Proxy API requests to a serverless function handler during development
    // In production (Vercel/Netlify), /api routes are handled automatically
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Note: Vite doesn't natively support serverless functions
        // For local testing with serverless functions, use Vercel CLI or Netlify CLI
      }
    }
  }
});