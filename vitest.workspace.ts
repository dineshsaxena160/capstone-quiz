import { resolve } from 'node:path';
import { defineWorkspace } from 'vitest/config';

const contractsSource = resolve(process.cwd(), 'packages/contracts/src/index.ts');

export default defineWorkspace([
  {
    root: 'packages/contracts',
    resolve: { alias: { '@quiz/contracts': contractsSource } },
    test: { name: 'contracts', environment: 'node', include: ['tests/**/*.test.ts'] },
  },
  {
    root: 'backend',
    resolve: { alias: { '@quiz/contracts': contractsSource } },
    test: { name: 'backend', environment: 'node', include: ['tests/**/*.test.ts'] },
  },
  {
    root: 'frontend',
    resolve: { alias: { '@quiz/contracts': contractsSource } },
    test: {
      name: 'frontend',
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
    },
  },
]);