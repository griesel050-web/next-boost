import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

const pages = [
  'index', '404',
  'achievements/index', 'admin/index', 'analytics/index', 'b/index',
  'completed/index', 'confirm-email/index', 'dashboard/index', 'earn/index',
  'guides/index', 'guides/discord-members/index', 'guides/instagram-followers/index',
  'guides/tiktok-followers/index', 'guides/twitter-x-followers/index', 'guides/youtube-views/index',
  'leaderboard/index', 'login/index', 'my-tasks/index', 'post-task/index',
  'profile/index', 'referral/index', 'reset-password/index', 'settings/index',
  'share/index', 'signup/index', 'store/index', 'u/index',
];

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p.replace(/\//g, '-'), r(`./${p}.html`)])),
    },
  },
  server: { port: 5173 },
});
