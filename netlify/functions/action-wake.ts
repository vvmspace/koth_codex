import type { Handler } from '@netlify/functions';
import { computeReferralGrants, getWakeEligibility, resetDailyCountIfNeeded } from '@koth/shared/domain/rules';
import { getServiceDb } from './lib/db';
import { requireUser } from './lib/auth';
import { json } from './lib/http';
import { loadConfig } from './lib/config';
import { enforceRateLimit } from './lib/rate-limit';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const idempotencyKey = event.headers['x-idempotency-key'];
    if (!idempotencyKey) return json(400, { error: 'Missing x-idempotency-key' });

    const user = await requireUser(event);
    enforceRateLimit(`wake-ip:${event.headers['x-forwarded-for'] || 'unknown'}`, 10, 60_000);
    enforceRateLimit(`wake-user:${user.id}`, 5, 60_000);

    const db = getServiceDb();
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

    if (!eligibility.available) {
      return json(400, { error: 'Action unavailable', eligibility });
    }

    const existing = await db.from('ledger').select('id').eq('idempotency_key', idempotencyKey).maybeSingle();
    if (existing.data) return json(200, { ok: true, deduped: true, eligibility });

    const next = new Date(now.getTime() + config.cooldown_ms).toISOString();
    const newDailyCount = daily.dailyCount + 1;

    const { error: updateError } = await db
      .from('users')
      .update({
        steps: user.steps + config.steps_per_wake,
        next_available_at: next,
        daily_free_count: newDailyCount,
        daily_free_reset_date: daily.dailyResetDate,
        updated_at: now.toISOString()
      })
      .eq('id', user.id);
    if (updateError) return json(500, { error: updateError.message });

    await db.from('ledger').insert({
      user_id: user.id,
      kind: 'wake',
      delta_steps: config.steps_per_wake,
      idempotency_key: idempotencyKey,
      meta: { at: now.toISOString() }
    });

    if (user.referrer_id) {
      const { data: lvl1 } = await db.from('users').select('id,referrer_id,sandwiches').eq('id', user.referrer_id).single();
      const hasLevel2 = !!lvl1?.referrer_id;
      const grants = computeReferralGrants(config.sandwich_per_ref_action, config.coffee_per_ref2_action, true, hasLevel2);
      if (lvl1) {
        await db.from('users').update({ sandwiches: (lvl1.sandwiches || 0) + grants.level1Sandwiches }).eq('id', lvl1.id);
        await db.from('ledger').insert({
          user_id: lvl1.id,
          kind: 'ref_reward_lvl1',
          delta_sandwiches: grants.level1Sandwiches,
          meta: { source_user_id: user.id }
        });
      }
      if (hasLevel2 && lvl1?.referrer_id) {
        const { data: lvl2 } = await db.from('users').select('id,coffee').eq('id', lvl1.referrer_id).single();
        if (lvl2) {
          await db.from('users').update({ coffee: (lvl2.coffee || 0) + grants.level2Coffee }).eq('id', lvl2.id);
          await db.from('ledger').insert({
            user_id: lvl2.id,
            kind: 'ref_reward_lvl2',
            delta_coffee: grants.level2Coffee,
            meta: { source_user_id: user.id }
          });
        }
      }
    }

    return json(200, { ok: true, next_available_at: next, remaining_free_actions: Math.max(config.max_free_actions_per_day - newDailyCount, 0) });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
