import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine API URL based on mode and environment variables
  const getApiUrl = () => {
    if (env.VITE_API_URL) {
      return env.VITE_API_URL;
    }
    
    // Fallback based on mode
    switch (mode) {
      case 'production':
        return 'https://enterprise-churn-prediction-platform.onrender.com/api';
      case 'development':
        return 'http://localhost:5000/api';
      default:
        return 'http://localhost:5000/api';
    }
  };

  const apiUrl = getApiUrl();
  console.log(`🔧 Vite Config - Mode: ${mode}, API URL: ${apiUrl}`);

  return {
    plugins: [react()],
    
    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
      },
    },

    server: {
      port: 5174,
      host: true, // Allow external connections
      open: mode === 'development', // Auto-open browser in development
      cors: {
        origin: [
          'http://localhost:5174',
          'http://localhost:3000',
          'http://127.0.0.1:5174',
          'https://*.vercel.app',
          'https://*.netlify.app',
          env.VITE_FRONTEND_URL || '*'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
      },
      
      // Proxy configuration for development
      proxy: mode === 'development' ? {
        '/api': {
          target: apiUrl.replace('/api', ''), // Remove /api suffix for proxy
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path, // Keep the /api prefix
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, _res) => {
              console.log('❌ Proxy error:', err.message);
              console.log('   Request URL:', req.url);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`📤 Proxy Request: ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`📥 Proxy Response: ${proxyRes.statusCode} ${req.url}`);
            });
          },
          headers: {
            'Origin': 'http://localhost:5174'
          }
        },
      } : undefined,
    },

    // Environment variable definitions
    define: {
      __API_URL__: JSON.stringify(apiUrl),
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'ChurnPredict'),
      __DEV__: JSON.stringify(mode === 'development'),
      __PROD__: JSON.stringify(mode === 'production'),
      __STAGING__: JSON.stringify(mode === 'staging'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // Dependency optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-hot-toast'],
      exclude: ['lucide-react'],
      esbuildOptions: {
        target: 'es2020'
      }
    },

    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production', // Source maps for non-production builds
      target: 'es2020',
      minify: mode === 'production' ? 'esbuild' : false,
      
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for core React libraries
            vendor: ['react', 'react-dom'],
            
            // UI libraries chunk
            ui: ['lucide-react', 'framer-motion'],
            
            // Charts and visualization libraries
            charts: ['recharts', 'd3'],
            
            // Utility libraries
            utils: ['lodash', 'date-fns'],
          },
          
          // Asset naming for better caching
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType ?? '')) {
              return 'images/[name]-[hash][extname]';
            }
            if (/woff2?|eot|ttf|otf/i.test(extType ?? '')) {
              return 'fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
        
        // External dependencies (don't bundle these)
        external: mode === 'production' ? [] : [],
      },
      
      // Compression and optimization
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
    },

    // Preview server configuration
    preview: {
      port: 5174,
      host: true,
      cors: true,
      open: true,
    },

    // CSS configuration
    css: {
      devSourcemap: mode === 'development',
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },

    // ESBuild configuration
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },

    // Test configuration (if you add testing later)
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});

