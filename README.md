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
- `REQUIRED_CHANNEL_ID` (optional)
- `APP_BASE_URL`
- `VITE_TELEGRAM_BOT_USERNAME`

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
