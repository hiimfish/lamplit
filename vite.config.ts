import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site under /<repo-name>/.
// Override with VITE_BASE if the repo ends up with a different name.
const pagesBase = process.env.VITE_BASE ?? '/english-learn/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? pagesBase : '/',
  plugins: [preact()],
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
