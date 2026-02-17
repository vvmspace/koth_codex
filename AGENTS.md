ROLE
You are an expert senior full-stack engineer. Build a minimal, production-lean skeleton for a Telegram Mini App (TMA) game "King of the Hill" with Telegram auth, referrals, cooldown-limited actions, inventory items, missions, and an extendable payments hook for TON later. Optimize for "ship fast, keep it simple, easy to extend".

GOAL
Create a working MVP that:
- Runs as a Telegram Mini App (WebApp) opened from a Telegram bot.
- Authenticates users via Telegram WebApp initData verification on the backend.
- Lets a user "Wake the King" (main action) on a cooldown timer (default: 8h) and max 3 free actions/day.
- Tracks steps (score), sandwiches, coffee (inventory currencies).
- Implements 2-level referrals with rewards triggered only when the referred user performs the main action during the active window.
- Has a leaderboard (rank by steps).
- Has a missions system that can be extended. Start with:
  - Mission: "Join channel" (verifiable via Telegram Bot API getChatMember, only if bot has required access).
  - Mission: "React/Like latest post" as MANUAL confirm for MVP (bots cannot reliably verify per-user reactions in channels; keep the mission type extensible for later).
- Includes placeholders to add TON payments later (TonConnect on frontend + server-side verification workflow stub), without implementing full financial logic now.

HOSTING + STACK
- Hosting: Netlify (static frontend + Netlify Functions).
- DB: Supabase Postgres (free tier friendly).
- Language: TypeScript everywhere.
- Frontend: Vite + React + TypeScript.
- Backend: Netlify Functions (TypeScript) + supabase-js.
- Telegram Bot framework: grammY (webhook-based).
- Package manager: Yarn.
- Repo structure: single repo with clear separation.

NON-GOALS (MVP)
- No complex admin panel (only minimal admin endpoints protected by an admin secret).
- No complex anti-fraud beyond basic server-side enforcement, idempotency, and rate limiting.
- No full TON payment implementation; only the integration scaffold.

DELIVERABLES
1) A complete codebase that runs locally and deploys to Netlify.
2) SQL migration(s) for Supabase schema.
3) .env.example with all required vars.
4) README with step-by-step setup (Supabase, Telegram bot, Netlify deploy, local dev).
5) Minimal UI that works inside Telegram.

CORE DOMAIN RULES
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
  - action is available only if now >= next_available_at
  - max 3 free wake actions per user per UTC day (or configurable timezone, but start with UTC).
  - if user exceeded free limit, action requires "paid credits" (placeholder) or premium status (placeholder).
- On success:
  - increment steps by CONFIG.steps_per_wake (default: 1).
  - update next_available_at = now + CONFIG.cooldown_ms (default: 8h).
  - increment daily counter.
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

DATABASE SCHEMA (Supabase Postgres)
Create migrations for:
- users:
  - id uuid pk default gen_random_uuid()
  - telegram_user_id bigint unique not null
  - username text
  - first_name text
  - last_name text
  - referral_code text unique not null
  - referrer_id uuid null references users(id)
  - steps bigint not null default 0
  - sandwiches bigint not null default 0
  - coffee bigint not null default 0
  - premium_until timestamptz null
  - next_available_at timestamptz not null default now()
  - daily_free_count int not null default 0
  - daily_free_reset_date date not null default current_date
  - created_at timestamptz not null default now()
  - updated_at timestamptz not null default now()
- config:
  - key text pk
  - value jsonb not null
  - updated_at timestamptz not null default now()
  Seed keys:
    - cooldown_ms
    - max_free_actions_per_day
    - steps_per_wake
    - sandwich_per_ref_action
    - coffee_per_ref2_action
- ledger:
  - id uuid pk default gen_random_uuid()
  - user_id uuid not null references users(id)
  - kind text not null (wake, ref_reward_lvl1, ref_reward_lvl2, mission_reward, admin_grant)
  - delta_steps bigint default 0
  - delta_sandwiches bigint default 0
  - delta_coffee bigint default 0
  - meta jsonb default '{}'::jsonb
  - idempotency_key text unique
  - created_at timestamptz not null default now()
- missions:
  - id uuid pk default gen_random_uuid()
  - type text not null
  - title text not null
  - description text not null
  - payload jsonb not null
  - reward jsonb not null
  - is_active boolean not null default true
  - starts_at timestamptz null
  - ends_at timestamptz null
  - created_at timestamptz not null default now()
- user_missions:
  - id uuid pk default gen_random_uuid()
  - user_id uuid not null references users(id)
  - mission_id uuid not null references missions(id)
  - status text not null (pending, completed)
  - completed_at timestamptz null
  - unique(user_id, mission_id)
- purchases (stub):
  - id uuid pk default gen_random_uuid()
  - user_id uuid not null references users(id)
  - provider text not null (ton)
  - status text not null (created, pending, confirmed, failed)
  - amount numeric
  - currency text
  - meta jsonb default '{}'::jsonb
  - created_at timestamptz not null default now()

Indexes:
- users(steps desc)
- users(referrer_id)
- ledger(user_id, created_at)
- missions(is_active)
- user_missions(user_id, status)

SECURITY + ENGINEERING PRACTICES
- Verify Telegram initData server-side always.
- JWT session signed with JWT_SECRET; include user_id and telegram_user_id.
- All write endpoints require auth.
- Add basic rate limiting per IP + per user for critical endpoints (wake, mission complete).
- Use idempotency keys for wake action and mission completion to prevent duplicates.
- No secrets in frontend; use Netlify environment variables.
- Types shared between frontend and backend (packages/shared).
- Provide minimal unit tests for core domain logic (cooldown, daily limit, referral rewards).
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
  supabase/
    migrations/
      001_init.sql
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
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server only)
- SUPABASE_ANON_KEY (frontend)
- JWT_SECRET
- ADMIN_SECRET
- TELEGRAM_BOT_TOKEN
- TELEGRAM_BOT_USERNAME
- REQUIRED_CHANNEL_ID (optional, for join_channel mission)
- APP_BASE_URL (Netlify URL)

LOCAL DEV
- Frontend: yarn dev (vite)
- Netlify functions: netlify dev (include instructions)
- Telegram webhooks: for local dev, use ngrok or netlify dev url; document both options.
- Provide a simple script or instructions to set Telegram webhook.

UI REQUIREMENTS (MINIMAL)
Home screen:
- Shows King status, steps, sandwiches, coffee
- Shows next available timer and remaining free actions today
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
- Include SQL migrations.
- Include README with exact commands.
- Make sure everything builds and runs with minimal setup.
- Keep the MVP small and clear; prioritize correctness and extendability.
