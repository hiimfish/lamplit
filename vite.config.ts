import preact from '@preact/preset-vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site under /<repo-name>/.
// Override with VITE_BASE if the repo ends up with a different name.
const pagesBase = process.env.VITE_BASE ?? '/english-learn/';

export default defineConfig(({ command, mode }) => ({
  base: command === 'build' ? pagesBase : '/',
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
