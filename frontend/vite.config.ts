import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const contractsEntry = fileURLToPath(new URL('../packages/contracts/src/index.ts', import.meta.url));

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/capstone-dinesh-quiz/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@quiz/contracts': contractsEntry,
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});