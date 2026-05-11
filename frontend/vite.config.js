// ⚙️ Configuración de Vite - MiProfesional Frontend
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  esbuild: {
    loader: 'jsx',
    include: [/.*\.jsx?$/, /.*\.js$/]
  },
  define: {
    // Configuración para producción
    __APP_ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
  }
});
