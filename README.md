# King of the Hill — Telegram Mini App MVP

MVP Telegram Mini App game on **Netlify Functions + MongoDB**.

## Stack
- Frontend: Vite + React + TypeScript (`web`)
- Backend: Netlify Functions + TypeScript (`netlify/functions`)
- DB: MongoDB (`mongodb/init/001_init.js`)
- Bot: grammY webhook (`/api/telegram-webhook`)
- Shared domain/types: `packages/shared`

## Setup
```bash
yarn install
cp .env.example .env
```

Fill `.env`:
- `MONGODB_CONNECTION_STRING`
- `MONGODB_DB_NAME` (optional, default `koth`)
- `JWT_SECRET`
- `ADMIN_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `REQUIRED_CHANNEL_ID` (default `-1003655493510`)
- `APP_BASE_URL`
- `VITE_TELEGRAM_BOT_USERNAME`
- `SENTRY_DSN` (optional, enables backend error tracking)
- `SENTRY_TRACES_SAMPLE_RATE` (optional, e.g. `0.1` to sample 10% transactions)
- `SLOW_REQUEST_THRESHOLD_MS` (optional, default `1200`, emits slow-request Sentry messages)
- `WAKE_INTERVAL_MS` (optional, default `28800000`, 8h between wakes)

## MongoDB init
Run once against your MongoDB:
```bash
mongosh "$MONGODB_CONNECTION_STRING" mongodb/init/001_init.js
```

## Local development
```bash
yarn dev:web
netlify dev
```

## Telegram webhook
```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=${APP_BASE_URL}/api/telegram-webhook"
```

## Build / checks
```bash
yarn test
yarn typecheck
yarn build
```

## Performance tracing (Frontend ↔ Netlify ↔ MongoDB)
- Frontend sends `x-trace-id` for each API request and logs `[api-trace]` to browser console with:
  - `front_total_ms`
  - `server_total_ms`
  - `db_total_ms`
  - `db_ops`
  - `network_plus_edge_ms`
- Netlify functions return timing headers:
  - `x-trace-id`
  - `x-server-total-ms`
  - `x-db-total-ms`
  - `x-db-ops`
  - `server-timing`
- Backend sends a Sentry warning message `Slow Netlify function request` when request latency exceeds `SLOW_REQUEST_THRESHOLD_MS`, with trace metadata (path, method, total, db breakdown).

## Missions seeded by init script
- `Join channel` (`join_channel`) is always active by default and uses channel id `-1003655493510` unless overridden by `REQUIRED_CHANNEL_ID`.
- `Connect wallet` (`connect_wallet`) rewards **50 sandwiches + 50 coffee** after wallet connection and mission completion.

## TON wallet connection
- Frontend uses TonConnect manifest from `web/public/tonconnect-manifest.json`.
- Replace placeholder URLs/icons in the manifest before production deploy.
- Connected wallet address is saved via `POST /api/payments/ton/confirm`.

## API
- `POST /api/auth/telegram`
- `POST /api/action/wake`
- `GET /api/inventory`
- `GET /api/leaderboard?limit=50`
- `GET /api/missions`
- `POST /api/missions/complete`
- `POST /api/items/buy` (stub)
- `POST /api/items/use` (stub)
- `POST /api/payments/ton/create-intent` (stub)
- `POST /api/payments/ton/confirm` (stub)
- `POST /api/admin/missions/create`
- `POST /api/admin/missions/activate-latest-post`
- `POST /api/admin/users/set-premium`

Admin endpoints require `x-admin-secret`.
