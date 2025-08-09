import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5174,
      cors: {
        origin: 'http://localhost:5174',
        credentials: true,
      },
      proxy: mode === 'development'
        ? {
            '/api': {
              target: env.VITE_API_URL || 'http://localhost:5000',
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});

