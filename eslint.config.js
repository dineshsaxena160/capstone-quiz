import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.vite/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'backend/src/**/*.{ts,tsx}',
      'frontend/src/**/*.{ts,tsx}',
      'packages/contracts/src/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);