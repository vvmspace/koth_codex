# AGENTS.new.md (candidate for the canonical `AGENTS.md` in `koth_codex`)

## ROLE
You are a senior full-stack engineer maintaining and extending the **King of the Hill** Telegram Mini App (TMA).
Core principle: ship small, safe iterations with production-ready quality, without breaking the current MVP.

---

## 1) What is already implemented (do not break without explicit reason)

### Platform
- Monorepo with Yarn workspaces.
- Frontend: `web` (Vite + React + TypeScript).
- Backend: Netlify Functions (`netlify/functions/*.ts`) in TypeScript.
- Shared domain code: `packages/shared`.
- MongoDB init/indexes/seeds: `mongodb/init/001_init.js`.
- Telegram webhook bot (grammY): `/api/telegram-webhook`.

### MVP Features
- Telegram WebApp auth: server-side `initData` HMAC verification + JWT.
- `Wake the King` with cooldown from `last_awake + WAKE_INTERVAL_MS`.
- Balances: `steps`, `sandwiches`, `coffee`.
- 2-level referral rewards on wake.
- Leaderboard by `steps`.
- Missions: `join_channel`, `manual_confirm`, `connect_wallet`.
- TON scaffold:
  - `POST /api/payments/ton/create-intent`
  - `POST /api/payments/ton/confirm`
  - `ton_wallet_address` persistence.
- Profile/settings: name + language.
- Basic rate limiting for critical endpoints (`wake`, `missions`).
- Sentry + request tracing (`x-trace-id`, server/db timing).

---

## 2) Architecture invariants

1. **Server-authoritative**
   - Economy, resources, and progression are backend-only.
   - Frontend must not make balance-affecting business decisions.

2. **Cooldown invariant**
   - Source of truth: `users.last_awake`.
   - `next_available_at = last_awake + WAKE_INTERVAL_MS`.
   - Do not add `next_awake_at` unless critically necessary.

3. **Idempotency and audit**
   - For mutating POST endpoints with retry risk, use `x-idempotency-key`.
   - Record grants/spends in `ledger`.

4. **Deploy consistency (mandatory)**
   - Any schema/index/seed/required-data change must have an automatic deploy path.
   - Minimum: update `mongodb/init/001_init.js`.
   - For runtime seeds, use an approach similar to `ensureDefaultMissions`.

5. **Language normalization**
   - Canonical app language codes: only `en`, `es`.
   - Regional variants (`en-US`, `es_MX`) must normalize to base codes.

6. **Profile validation**
   - `first_name`: 2..32 after trim/space normalization.
   - Allowed chars: Unicode letters/digits, space, `.`, `_`, `'`, `-`.
   - Validation must match on frontend and backend.

7. **Security**
   - Never trust client input.
   - Write endpoints require auth.
   - Admin endpoints require `x-admin-secret`.
   - Secrets must live only in env variables.

8. **Documentation anti-drift**
   - If behavior changes, update `AGENTS.md` in the same PR.
   - If a rule is outdated, update the rule first, then continue implementation.
   - Avoid scattered “history notes”; update sections structurally (invariants, UX, file map).
   - Any critical new convention should include: AGENTS rule + code-level check + short README note if process is affected.

9. **Inventory model (RPG/MMO approach)**
   - `steps` is score/progression, **not a backpack item**.
   - `sandwiches` and `coffee` are user inventory resources/items.
   - Extensible item storage:
     - short term (MVP): current fields in `users`;
     - target model: `user_items` (`user_id`, `item_key`, `amount`, `updated_at`).
   - Keep item metadata/effects in a separate source (`items_catalog`/config), server-driven.
   - Item use must be backend-only with ledger audit and idempotency.
   - Backpack shows only items the user actually has; empty state explains earning through core loop (wake + referrals).

---

## 3) UX invariants (must be preserved)

### Home / Backpack
- Do not render items with `amount = 0`.
- If inventory is empty, show an empty-state with clear 2-level referral explanation.
- Tap on item: immediate use.
- Long tap: info menu only (description only, no Activate/Close actions).
- Close info menu by tapping outside content (overlay).

### Missions
- `connect_wallet` mission has a TonConnect UI flow.
- Mission cards with URL support link navigation.

### Referral
- Deep link format: `https://t.me/<bot>?start=ref_<referral_code>`.
- Copy/share/open flows use Telegram WebApp API when available.

---

## 4) Engineering standards

1. **Minimal changes**
   - Prefer the smallest viable change.
   - Do not perform broad refactors without explicit request.

2. **API compatibility**
   - If endpoint contracts change, keep compatibility or update all consumers in the same PR.

3. **Checks before completion**
   - Minimum:
     - `yarn test`
     - `yarn typecheck`
     - `yarn build`
   - If a command cannot run due to environment limits, document the reason clearly.

4. **Observability**
   - Do not remove tracing headers.
   - For new critical endpoints, follow current Sentry pattern (`captureException`/`withSentry`).

5. **Code style**
   - Small functions, early returns, explicit input validation.
   - Do not hide business logic in UI.

---

## 5) Key file map

- Auth/JWT/Telegram verify:
  - `netlify/functions/lib/auth.ts`
  - `netlify/functions/auth-telegram.ts`
- Wake + referrals:
  - `netlify/functions/action-wake.ts`
  - `packages/shared/domain/rules.ts`
- Missions:
  - `netlify/functions/missions.ts`
  - `netlify/functions/lib/mission-seeds.ts`
- Profile/language:
  - backend: `netlify/functions/lib/profile-validation.ts`, `netlify/functions/lib/language.ts`
  - frontend: `web/src/app/validation.ts`
- Inventory/items:
  - `netlify/functions/inventory.ts`
  - `netlify/functions/items-use.ts`
  - `netlify/functions/items-buy.ts`
- TON scaffold:
  - `netlify/functions/payments-ton-create-intent.ts`
  - `netlify/functions/payments-ton-confirm.ts`
  - `web/src/app/screens/Premium.tsx`
  - `web/src/app/screens/Missions.tsx`
- DB init/indexes/seeds:
  - `mongodb/init/001_init.js`
- Routing:
  - `netlify.toml`
  - `web/vite.config.ts`
