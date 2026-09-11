import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const contractsEntry = fileURLToPath(new URL('../packages/contracts/src/index.ts', import.meta.url));
const basePath = process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS === 'true' ? '/capstone-quiz/' : '/');

export default defineConfig({
  base: basePath,
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