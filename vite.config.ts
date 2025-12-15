import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual (development/production)
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  const rawBasePath = env.VITE_BASE_PATH?.trim();
  let basePath = rawBasePath && rawBasePath.length > 0 ? rawBasePath : '/';
  if (!basePath.endsWith('/')) {
    basePath = `${basePath}/`;
  }

  return {
    plugins: [react()],
    base: basePath,
    define: {
      // Isso permite que as variáveis de ambiente sejam substituídas pelo valor real durante o build
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY)
    },
    server: {
      host: '0.0.0.0',
      port: 3000
    }
  };
});