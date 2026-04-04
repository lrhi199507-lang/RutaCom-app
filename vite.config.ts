import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración optimizada para generar la APK
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
