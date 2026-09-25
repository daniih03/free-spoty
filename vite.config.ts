import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

/** Marca de versión única por build: se escribe en version.json y se inyecta en el bundle. */
const BUILD_VERSION = Date.now();

function versionPlugin(): Plugin {
  return {
    name: 'version-generator',
    apply: 'build',
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify({ version: BUILD_VERSION }, null, 2));
    },
  };
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
