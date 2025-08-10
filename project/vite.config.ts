import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5174,
      host: true, // Fix: Allow external connections
      cors: {
        origin: [
          'http://localhost:5174',
          'http://localhost:3000',
          'http://127.0.0.1:5174',
          'https://*.vercel.app',
          env.VITE_FRONTEND_URL || '*'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      },
      // Fix: Improved proxy configuration for development
      proxy: mode === 'development' ? {
        '/api': {
          target: env.VITE_API_URL || 'https://enterprise-churn-prediction-platform.onrender.com',
          changeOrigin: true,
          secure: true, // Fix: Set to true for HTTPS targets
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
          headers: {
            'Origin': 'http://localhost:5174'
          }
        },
      } : undefined,
    },
    // Fix: Better environment variable definition
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
      __DEV__: JSON.stringify(mode === 'development'),
      __PROD__: JSON.stringify(mode === 'production'),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      // Fix: Better build configuration
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react', 'framer-motion'],
          },
        },
      },
    },
    // Fix: Better preview server configuration
    preview: {
      port: 5174,
      host: true,
      cors: true,
    },
  };
});

