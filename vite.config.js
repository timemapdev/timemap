import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      sourcemap: true,
    },
    plugins: [react()],
    server: {
      port: 8080,
    },
  }
})