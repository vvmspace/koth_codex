# King of the Hill — Telegram Mini App MVP

Minimal production-lean skeleton for a Telegram Mini App game with Telegram auth, cooldown-limited action, referrals, missions, leaderboard, inventory, and TON payment scaffolding.

## Stack
- Frontend: Vite + React + TypeScript (`web`)
- Backend: Netlify Functions + TypeScript (`netlify/functions`)
- DB: Supabase Postgres (`supabase/migrations`)
- Bot: grammY webhook (`/api/telegram-webhook`)
- Shared types/rules: `packages/shared`

## 1) Setup

```bash
yarn install
cp .env.example .env
```

Fill `.env` with:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `ADMIN_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `REQUIRED_CHANNEL_ID` (optional)
- `APP_BASE_URL` (Netlify URL or local tunnel URL)
- `VITE_TELEGRAM_BOT_USERNAME`

## 2) Supabase schema

Run migration `supabase/migrations/001_init.sql` in Supabase SQL editor.

## 3) Local dev

Start app with Netlify local routing + functions + Vite:

```bash
npx netlify-cli@23.15.1 dev --filter web
```

Or run only frontend:

```bash
yarn dev
```

### Local smoke-check (quick emulate)

```bash
yarn install --frozen-lockfile
yarn test
yarn typecheck
yarn build
yarn dev
# in another terminal:
curl -I http://localhost:5173/
```

If `netlify dev` crashes in a container because of Edge runtime bootstrap, still validate the app shell with `yarn dev` and validate domain logic via `yarn test`.

## 3.1) Local Telegram emulation tips

- In desktop/mobile browser outside Telegram, `window.Telegram.WebApp.initData` is empty by default.
- For full auth flow testing, open the app from Telegram via bot `web_app` button.
- For local webhook testing, use `APP_BASE_URL` from `netlify dev --live` or ngrok and set Telegram webhook to `/api/telegram-webhook`.

## 4) Telegram bot webhook

Set webhook to your deploy/local tunnel:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=${APP_BASE_URL}/api/telegram-webhook"
```

If local, use one of:
- `netlify dev --live`
- ngrok tunnel to your local URL and set `APP_BASE_URL` accordingly.

## 5) Netlify deploy (step-by-step)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site → Import an existing project**.
3. Build settings:
   - Base directory: *(empty)*
   - Build command: `yarn build`
   - Publish directory: `web/dist`
4. Set environment variables in **Site settings → Environment variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `ADMIN_SECRET`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME`
   - `REQUIRED_CHANNEL_ID` (optional)
   - `APP_BASE_URL` = your Netlify site URL (e.g. `https://your-site.netlify.app`)
   - `VITE_TELEGRAM_BOT_USERNAME`
5. Deploy site.
6. After first deploy, configure Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://<your-netlify-site>.netlify.app/api/telegram-webhook"
```

7. In BotFather, configure Mini App / menu button to open your Netlify URL.
8. Open the app from Telegram and do first run with `/start` and `/start ref_<code>`.

## 6) Bot flow

- `/start` or `/start ref_<code>` opens and binds referral if first-time user.
- Bot sends web_app button: **Open Mini App**.

## API overview

- `POST /api/auth/telegram`
- `POST /api/action/wake`
- `GET /api/inventory`
- `POST /api/items/buy` (stub)
- `POST /api/items/use` (stub)
- `GET /api/missions`
- `POST /api/missions` (complete)
- `GET /api/leaderboard?limit=50`
- `POST /api/payments/ton/create-intent` (stub)
- `POST /api/payments/ton/confirm` (stub)
- `POST /api/admin/missions/create`
- `POST /api/admin/missions/activate-latest-post` (stub)
- `POST /api/admin/users/set-premium`

Admin endpoints require `x-admin-secret` header.

## Tests

```bash
yarn test
```

Covers pure domain rules:
- cooldown checks
- daily limit checks
- daily reset
- referral grant computation
