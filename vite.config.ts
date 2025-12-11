import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
  base: '/ThemisScan---ANALISADOR-DE-CONTRATOS-JUR-DICOS/',
  // Usaremos import.meta.env.VITE_* diretamente, sem define manual
  server: {
    host: '0.0.0.0',
    port: 3000
  }
}));