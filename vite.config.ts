import preact from '@preact/preset-vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site under /<repo-name>/ (the repo is lamplit).
// Override with VITE_BASE if the repo ends up with a different name. `vite preview` uses
// the same base so it serves the built site the way Pages does.
const pagesBase = process.env.VITE_BASE ?? '/lamplit/';

export default defineConfig(({ command, mode, isPreview }) => ({
  base: command === 'build' || isPreview ? pagesBase : '/',
  // `npm run dev:https` serves a self-signed https site so phones on the LAN can use the
  // microphone (browsers only allow it in a secure context; plain LAN http is not one).
  plugins: [preact(), ...(mode === 'https' ? [basicSsl()] : [])],
  // Agent worktrees, scratch files and docs live inside the repo; watching them makes the dev
  // server crawl and balloon in memory.
  server: { host: true, watch: { ignored: ['**/.claude/**', '**/.tmp/**', '**/docs/**'] } },
  build: { chunkSizeWarningLimit: 2000 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
