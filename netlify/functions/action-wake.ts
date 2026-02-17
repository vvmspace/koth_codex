import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { computeReferralGrants, getWakeEligibility, resetDailyCountIfNeeded } from '@koth/shared/domain/rules';
import { requireUser } from './lib/auth';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';
import { loadConfig } from './lib/config';
import { enforceRateLimit } from './lib/rate-limit';
import { getDb } from './lib/db';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const idempotencyKey = event.headers['x-idempotency-key'];
    if (!idempotencyKey) return json(400, { error: 'Missing x-idempotency-key' });

    const user = await requireUser(event);
    enforceRateLimit(`wake-ip:${event.headers['x-forwarded-for'] || 'unknown'}`, 10, 60_000);
    enforceRateLimit(`wake-user:${user.id}`, 5, 60_000);

    const db = await getDb();
    const config = await loadConfig();
    const now = new Date();

    const daily = resetDailyCountIfNeeded(user.daily_free_reset_date, user.daily_free_count, now);
    const eligibility = getWakeEligibility({
      now,
      nextAvailableAt: new Date(user.next_available_at),
      dailyFreeCount: daily.dailyCount,
      config,
      isPremium: !!(user.premium_until && new Date(user.premium_until) > now)
    });

    if (!eligibility.available) return json(400, { error: 'Action unavailable', eligibility });

    const existing = await db.collection('ledger').findOne({ idempotency_key: idempotencyKey });
    if (existing) return json(200, { ok: true, deduped: true, eligibility });

    const next = new Date(now.getTime() + config.cooldown_ms);
    const newDailyCount = daily.dailyCount + 1;

    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      {
        $set: {
          next_available_at: next,
          daily_free_count: newDailyCount,
          daily_free_reset_date: daily.dailyResetDate,
          updated_at: now
        },
        $inc: { steps: config.steps_per_wake }
      }
    );

    await db.collection('ledger').insertOne({
      user_id: new ObjectId(user.id),
      kind: 'wake',
      delta_steps: config.steps_per_wake,
      delta_sandwiches: 0,
      delta_coffee: 0,
      idempotency_key: idempotencyKey,
      meta: { at: now.toISOString() },
      created_at: now
    });

    if (user.referrer_id) {
      const lvl1 = await db.collection('users').findOne({ _id: new ObjectId(String(user.referrer_id)) });
      const hasLevel2 = !!lvl1?.referrer_id;
      const grants = computeReferralGrants(config.sandwich_per_ref_action, config.coffee_per_ref2_action, true, hasLevel2);

      if (lvl1 && grants.level1Sandwiches > 0) {
        await db.collection('users').updateOne({ _id: lvl1._id }, { $inc: { sandwiches: grants.level1Sandwiches } });
        await db.collection('ledger').insertOne({
          user_id: lvl1._id,
          kind: 'ref_reward_lvl1',
          delta_steps: 0,
          delta_sandwiches: grants.level1Sandwiches,
          delta_coffee: 0,
          meta: { source_user_id: user.id },
          created_at: now
        });
      }

      if (hasLevel2 && lvl1?.referrer_id && grants.level2Coffee > 0) {
        const lvl2 = await db.collection('users').findOne({ _id: new ObjectId(String(lvl1.referrer_id)) });
        if (lvl2) {
          await db.collection('users').updateOne({ _id: lvl2._id }, { $inc: { coffee: grants.level2Coffee } });
          await db.collection('ledger').insertOne({
            user_id: lvl2._id,
            kind: 'ref_reward_lvl2',
            delta_steps: 0,
            delta_sandwiches: 0,
            delta_coffee: grants.level2Coffee,
            meta: { source_user_id: user.id },
            created_at: now
          });
        }
      }
    }

    return json(200, {
      ok: true,
      next_available_at: next.toISOString(),
      remaining_free_actions: Math.max(config.max_free_actions_per_day - newDailyCount, 0)
    });
  } catch (error) {
    captureException(error, { path: event.path, http_method: event.httpMethod });
    return json(401, { error: (error as Error).message });
  }
};

export const handler = withSentry(baseHandler);
