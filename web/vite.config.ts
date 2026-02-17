import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:9999';

const routeMap: Record<string, string> = {
  '/api/auth/telegram': '/.netlify/functions/auth-telegram',
  '/api/action/wake': '/.netlify/functions/action-wake',
  '/api/inventory': '/.netlify/functions/inventory',
  '/api/leaderboard': '/.netlify/functions/leaderboard',
  '/api/missions': '/.netlify/functions/missions',
  '/api/missions/complete': '/.netlify/functions/missions',
  '/api/items/buy': '/.netlify/functions/items-buy',
  '/api/items/use': '/.netlify/functions/items-use',
  '/api/admin/missions/create': '/.netlify/functions/admin-missions-create',
  '/api/admin/missions/activate-latest-post': '/.netlify/functions/admin-missions-activate-latest-post',
  '/api/admin/users/set-premium': '/.netlify/functions/admin-users-set-premium',
  '/api/payments/ton/create-intent': '/.netlify/functions/payments-ton-create-intent',
  '/api/payments/ton/confirm': '/.netlify/functions/payments-ton-confirm',
  '/api/telegram-webhook': '/.netlify/functions/telegram-webhook'
};

function rewriteApiPath(path: string): string {
  return routeMap[path] || path;
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: rewriteApiPath
      }
    }
  }
});
