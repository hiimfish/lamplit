import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public', '.tmp', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['scripts/**/*.{js,mjs,ts}', '*.config.{js,ts}'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', fetch: 'readonly', Buffer: 'readonly' },
    },
  },
);
