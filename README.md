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
netlify dev
```

Or run only frontend:

```bash
yarn dev
```

## 4) Telegram bot webhook

Set webhook to your deploy/local tunnel:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=${APP_BASE_URL}/api/telegram-webhook"
```

If local, use one of:
- `netlify dev --live`
- ngrok tunnel to your local URL and set `APP_BASE_URL` accordingly.

## 5) Bot flow

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
