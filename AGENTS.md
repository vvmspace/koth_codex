ROLE
You are an expert senior full-stack engineer. Build a minimal, production-lean skeleton for a Telegram Mini App (TMA) game "King of the Hill" with Telegram auth, referrals, cooldown-limited actions, inventory items, missions, and an extendable payments hook for TON later. Optimize for "ship fast, keep it simple, easy to extend".

ADDITIONAL PRODUCT STANDARD
- Development of every feature in the app must be production-ready.
- The app should look premium by concept ("expensive" visual feel), while still keeping MVP scope.

GOAL
Create a working MVP that:
- Runs as a Telegram Mini App (WebApp) opened from a Telegram bot.
- Authenticates users via Telegram WebApp initData verification on the backend.
- Lets a user "Wake the King" (main action) on a cooldown timer configured via env var in ms (default: 8h / 28800000).
- Tracks steps (score), sandwiches, coffee (inventory currencies).
- Implements 2-level referrals with rewards triggered only when the referred user performs the main action during the active window.
- Has a leaderboard (rank by steps).
- Has a missions system that can be extended. Start with:
  - Mission: "Join channel" (verifiable via Telegram Bot API getChatMember, only if bot has required access).
  - Mission: "React/Like latest post" as MANUAL confirm for MVP (bots cannot reliably verify per-user reactions in channels; keep the mission type extensible for later).
- Includes placeholders to add TON payments later (TonConnect on frontend + server-side verification workflow stub), without implementing full financial logic now.

HOSTING + STACK
- Hosting: Netlify (static frontend + Netlify Functions).
- DB: MongoDB (Atlas/free tier friendly).
- Language: TypeScript everywhere.
- Frontend: Vite + React + TypeScript.
- Backend: Netlify Functions (TypeScript) + MongoDB Node.js driver.
- Telegram Bot framework: grammY (webhook-based).
- Package manager: Yarn.
- Repo structure: single repo with clear separation.

NON-GOALS (MVP)
- No complex admin panel (only minimal admin endpoints protected by an admin secret).
- No complex anti-fraud beyond basic server-side enforcement, idempotency, and rate limiting.
- No full TON payment implementation; only the integration scaffold.

DELIVERABLES
1) A complete codebase that runs locally and deploys to Netlify.
2) MongoDB initialization/setup script(s) for required collections and indexes.
3) .env.example with all required vars.
4) README with step-by-step setup (MongoDB, Telegram bot, Netlify deploy, local dev).
5) Minimal UI that works inside Telegram.

CORE DOMAIN RULES
LANGUAGE CODE FORMAT (CRITICAL)
- Persist only canonical app language codes in DB: `en` or `es`.
- Accept Telegram/user locale variants (`en-US`, `en_US`, `es-ES`, etc.) only as input, then normalize to base language before DB writes.
- Never store regional variants in `users.language_code`.
- When locale is missing/unknown, fallback to `en`.

PROFILE NAME INPUT FORMAT (CRITICAL)
- `first_name` accepted length: 2..32 chars after trim/space normalization.
- Allowed chars: Unicode letters, numbers, spaces, dot (`.`), underscore (`_`), apostrophe (`'`), hyphen (`-`).
- Validate in both frontend and backend before write.

CHANNEL CONFIG DEFAULT
- Keep `DEFAULT_CHANNEL_ID` set to `-1003655493510` in code as the fallback default for join-channel mission checks and seeds.

A) Auth
- Frontend reads Telegram initData from window.Telegram.WebApp.initData.
- Frontend sends initData to backend endpoint POST /api/auth/telegram.
- Backend verifies initData HMAC using Telegram algorithm and BOT_TOKEN.
- Backend upserts user by telegram_user_id.
- Backend returns a signed session token (JWT) used for all subsequent API calls.
- All game-changing actions must be server-side validated and written in DB.

B) Main action: Wake the King
- Endpoint: POST /api/action/wake
- Server enforces:
  - action is available only if last_awake is null OR now >= (last_awake + WAKE_INTERVAL_MS)
  - wake interval is configured through env var `WAKE_INTERVAL_MS` (milliseconds), default `28800000`.
- On success:
  - increment steps by CONFIG.steps_per_wake (default: 1).
  - grant acting user sandwiches += CONFIG.sandwiches_per_wake (default: 1) and coffee += CONFIG.coffee_per_wake (default: 1).
  - set `last_awake` = now.
  - all cooldown timers in backend and UI are calculated from `last_awake + WAKE_INTERVAL_MS` (no separate stored next-available timestamp).
  - referral rewards:
    - if user.referrer_id exists (level 1): grant to referrer sandwiches += CONFIG.sandwich_per_ref_action (default: 1).
    - if referrer.referrer_id exists (level 2): grant to level2 coffee += CONFIG.coffee_per_ref2_action (default: 1).
    - also ensure level1 still gets sandwiches for level2 activity if applicable (define explicitly):
      - when level2 user performs wake:
        - level1 gets sandwiches
        - level2 referrer (level1) is the inviter of the acting user
        - level2's inviter (level2) gets coffee
- All grants are recorded in a ledger table for audit and idempotency.

C) Inventory / Items
- Maintain user balances for:
  - steps (score)
  - sandwiches
  - coffee
- Provide a generic "items" table so later you can add items like "motorcycle" that modifies steps_per_wake or cooldown.
- MVP: no item consumption UI is required, but implement the schema + endpoint stubs:
  - GET /api/inventory
  - POST /api/items/buy (stub, checks premium/credits later)
  - POST /api/items/use (stub, for future)

D) Referrals
- Bot /start supports start parameter ref_<code>.
- Each user has a stable referral_code (short, unique).
- On first start (user creation), if ref param exists and user has no referrer yet, set referrer_id.
- Provide a UI screen with the referral link and a "share" button using Telegram WebApp share features when possible.
- In UI, show safe copy text: "Option: share this link in chats where it is allowed." Do not instruct spamming.

E) Missions
- Missions are rows with:
  - type: join_channel | manual_confirm | (future types)
  - payload: JSON (channel_id, post_url, etc)
  - reward: JSON (steps, sandwiches, coffee)
  - is_active, starts_at, ends_at
- Missions shown to users must support multilingual content (at least EN/ES), with English as required fallback when a translation is missing.
- User mission completion table records status.
- Implement:
  - GET /api/missions (active + user status)
  - POST /api/missions/complete
    - join_channel: backend checks getChatMember for required channel, if possible (bot must have access; document this).
    - manual_confirm: accept completion with a server-side cooldown (anti-spam) and mark as completed (MVP).
- Add an internal admin endpoint:
  - POST /api/admin/missions/create (protected by ADMIN_SECRET)
  - POST /api/admin/missions/activate-latest-post (stub: admin provides post url; later can be automated)

F) Leaderboard
- GET /api/leaderboard?limit=50
- Show user display name (from Telegram), steps, rank.
- Efficient query with index on steps.

PAYMENTS (TON) - SCAFFOLD ONLY
- Frontend: add a "Premium" screen with a button "Connect wallet" (TonConnect UI placeholder).
- Backend:
  - Table: purchases (id, user_id, provider, status, amount, currency, created_at)
  - Endpoint stubs:
    - POST /api/payments/ton/create-intent
    - POST /api/payments/ton/confirm (later: verify on-chain tx)
- For now, premium can be toggled by admin endpoint for testing:
  - POST /api/admin/users/set-premium

DATABASE SCHEMA (MongoDB)
Use the following fixed model schema (MongoDB collections).

Conventions:
- `_id`: ObjectId
- Foreign keys are stored as ObjectId references (`user_id`, `referrer_id`, `mission_id`).
- Timestamps are ISODate.

users:
- `_id`: ObjectId
- `telegram_user_id`: NumberLong, unique, required
- `username`: string | null
- `first_name`: string | null
- `last_name`: string | null
- `referral_code`: string, unique, required
- `referrer_id`: ObjectId | null
- `steps`: NumberLong, required, default 0
- `sandwiches`: NumberLong, required, default 0
- `coffee`: NumberLong, required, default 0
- `premium_until`: ISODate | null
- `last_awake`: ISODate | null (source of truth for cooldown timers: `last_awake + WAKE_INTERVAL_MS`)
- `created_at`: ISODate, required, default now
- `updated_at`: ISODate, required, default now

config:
- `_id`: ObjectId
- `key`: string, unique, required
- `value`: object, required
- `updated_at`: ISODate, required, default now
- seed keys:
  - `cooldown_ms`
  - `steps_per_wake`
  - `sandwiches_per_wake`
  - `coffee_per_wake`
  - `sandwich_per_ref_action`
  - `coffee_per_ref2_action`

ledger:
- `_id`: ObjectId
- `user_id`: ObjectId, required
- `kind`: string, required (`wake`, `ref_reward_lvl1`, `ref_reward_lvl2`, `mission_reward`, `admin_grant`)
- `delta_steps`: NumberLong, default 0
- `delta_sandwiches`: NumberLong, default 0
- `delta_coffee`: NumberLong, default 0
- `meta`: object, default {}
- `idempotency_key`: string | null, unique when present
- `created_at`: ISODate, required, default now

missions:
- `_id`: ObjectId
- `type`: string, required (`join_channel`, `manual_confirm`, future types)
- `title`: string, required
- `description`: string, required
- `payload`: object, required
- `reward`: object, required
- `is_active`: boolean, required, default true
- `starts_at`: ISODate | null
- `ends_at`: ISODate | null
- `created_at`: ISODate, required, default now

user_missions:
- `_id`: ObjectId
- `user_id`: ObjectId, required
- `mission_id`: ObjectId, required
- `status`: string, required (`pending`, `completed`)
- `completed_at`: ISODate | null
- unique pair: (`user_id`, `mission_id`)

purchases (stub):
- `_id`: ObjectId
- `user_id`: ObjectId, required
- `provider`: string, required (`ton`)
- `status`: string, required (`created`, `pending`, `confirmed`, `failed`)
- `amount`: Decimal128 | string | null
- `currency`: string | null
- `meta`: object, default {}
- `created_at`: ISODate, required, default now

Indexes:
- users: `{ telegram_user_id: 1 }` unique, `{ referral_code: 1 }` unique, `{ steps: -1 }`, `{ referrer_id: 1 }`
- config: `{ key: 1 }` unique
- ledger: `{ idempotency_key: 1 }` unique (sparse), `{ user_id: 1, created_at: -1 }`
- missions: `{ is_active: 1 }`
- user_missions: `{ user_id: 1, mission_id: 1 }` unique, `{ user_id: 1, status: 1 }`
- purchases: `{ user_id: 1, created_at: -1 }`

SECURITY + ENGINEERING PRACTICES
- Verify Telegram initData server-side always.
- JWT session signed with JWT_SECRET; include user_id and telegram_user_id.
- All write endpoints require auth.
- Add basic rate limiting per IP + per user for critical endpoints (wake, mission complete).
- Use idempotency keys for wake action and mission completion to prevent duplicates.
- No secrets in frontend; use Netlify environment variables.
- Types shared between frontend and backend (packages/shared).
- Provide minimal unit tests for core domain logic (cooldown interval, referral rewards).
- Keep functions small, pure where possible.

PROJECT STRUCTURE (REQUIRED)
/
  netlify/
    functions/
      auth-telegram.ts
      action-wake.ts
      inventory.ts
      leaderboard.ts
      missions.ts
      admin-missions-create.ts
      admin-users-set-premium.ts
      telegram-webhook.ts
  web/
    src/
      main.tsx
      app/
        api.ts
        auth.ts
        screens/
          Home.tsx
          Leaderboard.tsx
          Missions.tsx
          Referral.tsx
          Premium.tsx
        components/
      index.html
      vite.config.ts
  packages/
    shared/
      types.ts
      domain/
        rules.ts (pure functions)
  mongodb/
    init/
      001_init.js
  README.md
  package.json (yarn workspaces)
  .env.example
  netlify.toml

TELEGRAM BOT FLOW
- Bot handles:
  - /start [ref_code]
  - a button "Open Mini App" (web_app button) that opens the Netlify web URL.
- Bot webhook endpoint is /api/telegram-webhook implemented in netlify/functions/telegram-webhook.ts.
- Store BOT_USERNAME and BOT_TOKEN in env.
- When /start includes ref code, call backend logic to set referrer if needed.

ENV VARS (.env.example)
- MONGODB_CONNECTION_STRING
- JWT_SECRET
- ADMIN_SECRET
- TELEGRAM_BOT_TOKEN
- TELEGRAM_BOT_USERNAME
- REQUIRED_CHANNEL_ID (optional, for join_channel mission, default `-1003655493510`)
- APP_BASE_URL (Netlify URL)
- SENTRY_DSN (for backend error tracking)
- WAKE_INTERVAL_MS (milliseconds between wakes, default 28800000 = 8h)

LOCAL DEV
- Frontend: yarn dev (vite)
- Netlify functions: netlify dev (include instructions)
- Telegram webhooks: for local dev, use ngrok or netlify dev url; document both options.
- Provide a simple script or instructions to set Telegram webhook.

UI REQUIREMENTS (MINIMAL)
Home screen:
- Shows King status, steps, sandwiches, coffee
- Shows next available timer
- Button "Wake the King" (disabled when not available)
- Small text: "Optional: share referral link where appropriate."

Missions screen:
- List active missions with status
- Complete button that triggers verification (join_channel) or manual confirm.

Leaderboard screen:
- Top list + current user rank

Referral screen:
- Shows referral link + copy/share

Premium screen:
- Placeholder: connect wallet + buy premium (stub)
- Admin can toggle premium for testing.

OUTPUT FORMAT
- Produce all files with full code (not pseudo code).
- Include MongoDB initialization scripts (collections/indexes).
- Include README with exact commands.
- Make sure everything builds and runs with minimal setup.
- Keep the MVP small and clear; prioritize correctness and extendability.

UPDATE (Backpack UX + Referral explanation)
- Backpack UI must hide zero-balance items (do not render empty item slots).
- If backpack has no items, show guidance to invite friends to earn sandwiches and coffee.
- Empty-state text must explain 2-level referral rewards clearly:
  - Level 1: when your invited friend wakes the King, you receive sandwiches.
  - Level 2: when your friend's invited friend wakes the King, Level 1 receives sandwiches and Level 2 inviter receives coffee.
- Sandwiches and coffee are game items; their gameplay effect (e.g., granting steps) must remain configurable and extensible so reward types/effects can change without hardcoded frontend assumptions.

- Backpack interaction details (UX):
  - Tap on item: activate/use item immediately (no modal/menu before activation).
  - Long tap on item: open an informational item menu with item description only (no Activate/Close buttons).
  - The informational menu closes when user taps outside the menu content area.

- Deployment/data consistency rule:
  - Any change that affects DB schema, seed data, or required records must include an automatic deploy-time update path (migration/seed-on-deploy) so production data is updated on deploy without manual DB patching.
