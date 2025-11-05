import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // permite usar @/ en imports
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    //  Solo genera source maps en desarrollo
    sourcemap: mode === 'development',

    // Opcional: optimización adicional en producción
    minify: 'esbuild', // o 'terser' si quieres compresión más avanzada
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
