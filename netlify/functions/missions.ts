import type { Handler } from '@netlify/functions';
import { requireUser } from './lib/auth';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';
import { enforceRateLimit } from './lib/rate-limit';
import { requiredEnv } from './lib/env';

async function checkChannelMembership(channelId: string, telegramUserId: number) {
  const token = requiredEnv('TELEGRAM_BOT_TOKEN');
  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${telegramUserId}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.ok && ['member', 'administrator', 'creator'].includes(body.result?.status);
}

export const handler: Handler = async (event) => {
  try {
    const user = await requireUser(event);
    const db = getServiceDb();

    if (event.httpMethod === 'GET') {
      const nowIso = new Date().toISOString();
      const { data: missions } = await db
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`);
      const { data: userMissions } = await db.from('user_missions').select('*').eq('user_id', user.id);
      return json(200, { missions: missions || [], user_missions: userMissions || [] });
    }

    if (event.httpMethod === 'POST') {
      enforceRateLimit(`mission-ip:${event.headers['x-forwarded-for'] || 'unknown'}`, 20, 60_000);
      enforceRateLimit(`mission-user:${user.id}`, 10, 60_000);
      const idem = event.headers['x-idempotency-key'];
      if (!idem) return json(400, { error: 'Missing x-idempotency-key' });
      const { mission_id } = JSON.parse(event.body || '{}');
      const { data: mission } = await db.from('missions').select('*').eq('id', mission_id).single();
      if (!mission || !mission.is_active) return json(404, { error: 'Mission not found' });

      const existing = await db.from('ledger').select('id').eq('idempotency_key', idem).maybeSingle();
      if (existing.data) return json(200, { ok: true, deduped: true });

      if (mission.type === 'join_channel') {
        const channelId = String(mission.payload.channel_id || process.env.REQUIRED_CHANNEL_ID || '');
        if (!channelId) return json(400, { error: 'No channel configured' });
        const ok = await checkChannelMembership(channelId, user.telegram_user_id);
        if (!ok) return json(400, { error: 'User is not a channel member or bot has insufficient access.' });
      }

      const reward = mission.reward || {};
      await db.from('users').update({
        steps: user.steps + Number(reward.steps || 0),
        sandwiches: user.sandwiches + Number(reward.sandwiches || 0),
        coffee: user.coffee + Number(reward.coffee || 0)
      }).eq('id', user.id);

      await db.from('user_missions').upsert({
        user_id: user.id,
        mission_id,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,mission_id' });

      await db.from('ledger').insert({
        user_id: user.id,
        kind: 'mission_reward',
        delta_steps: Number(reward.steps || 0),
        delta_sandwiches: Number(reward.sandwiches || 0),
        delta_coffee: Number(reward.coffee || 0),
        idempotency_key: idem,
        meta: { mission_id }
      });

      return json(200, { ok: true });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
