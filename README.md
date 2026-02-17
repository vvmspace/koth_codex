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
- `SUPABASE_DB_URL` (for deploy-time migrations)
- `JWT_SECRET`
- `ADMIN_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `REQUIRED_CHANNEL_ID` (optional)
- `APP_BASE_URL` (Netlify URL or local tunnel URL)
- `VITE_TELEGRAM_BOT_USERNAME`


## 1.1) Где брать переменные окружения (с ссылками)

| Переменная | Где взять | Ссылка |
|---|---|---|
| `SUPABASE_URL` | В Supabase: **Project Settings → API → Project URL** | https://supabase.com/dashboard/project/_/settings/api |
| `SUPABASE_ANON_KEY` | В Supabase: **Project Settings → API → anon public key** | https://supabase.com/dashboard/project/_/settings/api |
| `SUPABASE_SERVICE_ROLE_KEY` | В Supabase: **Project Settings → API → service_role key** (хранить только на backend/Netlify) | https://supabase.com/dashboard/project/_/settings/api |
| `SUPABASE_DB_URL` | Connection string к Postgres (Supabase: **Project Settings → Database → Connection string**). Нужен для автоматических миграций на деплое. | https://supabase.com/dashboard/project/_/settings/database |
| `JWT_SECRET` | Сгенерировать локально случайную строку (минимум 32 байта), например `openssl rand -base64 48` | https://www.openssl.org/docs/manmaster/man1/openssl-rand.html |
| `ADMIN_SECRET` | Любой отдельный длинный секрет для admin endpoint'ов (также `openssl rand -base64 48`) | https://www.openssl.org/docs/manmaster/man1/openssl-rand.html |
| `TELEGRAM_BOT_TOKEN` | Создать бота в BotFather командой `/newbot`, токен выдаст BotFather | https://t.me/BotFather |
| `TELEGRAM_BOT_USERNAME` | Username этого же бота в BotFather (без `@`) | https://t.me/BotFather |
| `REQUIRED_CHANNEL_ID` (optional) | ID канала для mission `join_channel`; можно получить через Telegram Bot API (`getChat`) | https://core.telegram.org/bots/api#getchat |
| `APP_BASE_URL` | URL вашего Netlify сайта (`https://<site>.netlify.app`) или локальный публичный tunnel URL | https://docs.netlify.com/manage/domains/manage-domains/ |
| `VITE_TELEGRAM_BOT_USERNAME` | Обычно равен `TELEGRAM_BOT_USERNAME` (используется на фронте для ссылки/шаринга) | https://core.telegram.org/bots/features#deep-linking |

Пример генерации секретов:

```bash
openssl rand -base64 48
```

Важно:
- `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ADMIN_SECRET`, `TELEGRAM_BOT_TOKEN` — только server-side (Netlify env), не в клиентский код.
- Все переменные из `.env` добавьте и в Netlify: **Site settings → Environment variables**.

## 2) Supabase schema

Migrations are stored in `supabase/migrations`.

- Manual first-run option: run `supabase/migrations/001_init.sql` in Supabase SQL editor.
- Deploy option (recommended): set `SUPABASE_DB_URL` and run:

```bash
yarn migrate:deploy
```

On Netlify production deploys, migrations are executed automatically **after successful deploy** via a local Netlify Build Plugin (`onSuccess`). `yarn build` remains frontend-only.

## 3) Local dev

Start app with Netlify local routing + functions + Vite:

```bash
yarn dev:functions
# in a second terminal:
yarn dev:web
```

Or run only frontend:

```bash
yarn dev
```

If `netlify dev` is unstable in your environment, use split mode:

```bash
yarn dev:functions
# in second terminal
yarn dev:web
```

In split mode, Vite proxies `/api` to `http://localhost:9999` (configurable via `VITE_API_PROXY_TARGET`).

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
- In local `vite` dev without Telegram, the app auto-switches to **Local demo mode** (mocked auth/data) so you can click through screens.
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
   - Post-deploy migrations run automatically via `netlify/plugins/postdeploy-migrate`
   - Publish directory: `web/dist`
4. Set environment variables in **Site settings → Environment variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_DB_URL` (for deploy-time migrations)
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

- `POST /api/auth/telegram` (also stores `language_code` + `country_code`)
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


## Troubleshooting

### Error: `Could not find the table 'public.users' in the schema cache`

This means your app is connected to Supabase, but the schema from `supabase/migrations/001_init.sql` is missing in that project (or env vars point to a different project).

1. Open Supabase SQL Editor for the same project as `SUPABASE_URL`.
2. Run `supabase/migrations/001_init.sql`.
3. Verify the table exists:
   ```sql
   select to_regclass('public.users');
   ```
   It should return `public.users`.
4. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` come from the **same** Supabase project.
5. Redeploy/restart Netlify functions after updating env vars.



### Error: `Could not find the 'country_code' column of 'users' in the schema cache`

Your database is missing newer locale columns. Apply latest migrations:

```bash
yarn migrate:deploy
```

Or run SQL manually from:
- `supabase/migrations/003_user_country_code.sql`
- `supabase/migrations/004_user_locale_guard.sql`

Then retry the request.

## Localization + leaderboard flags

- UI language is auto-detected (`en`/`es`) from Telegram `language_code`, fallback to browser language.
- Backend stores user language and country code separately in `users.language_code` and `users.country_code`.
- Leaderboard renders each user country flag when present.
