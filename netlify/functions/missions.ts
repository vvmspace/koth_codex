import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';
import { enforceRateLimit } from './lib/rate-limit';
import { requiredEnv } from './lib/env';
import { ensureDefaultMissions } from './lib/mission-seeds';
import { normalizeSupportedLanguage } from './lib/language';

function resolveLocalizedText(
  map: Record<string, unknown> | null | undefined,
  language: string,
  fallback: unknown
) {
  if (!map || typeof map !== 'object') return String(fallback || '');
  const localized = map[language] || map.en;
  return typeof localized === 'string' ? localized : String(fallback || '');
}

async function checkChannelMembership(channelId: string, telegramUserId: number) {
  const token = requiredEnv('TELEGRAM_BOT_TOKEN');
  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${telegramUserId}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.ok && ['member', 'administrator', 'creator'].includes(body.result?.status);
}

const baseHandler: Handler = async (event) => {
  try {
    const user = await requireUser(event);
    const db = await getDb();
    await ensureDefaultMissions(db);

    if (event.httpMethod === 'GET') {
      const now = new Date();
      const language = normalizeSupportedLanguage((user as { language_code?: string | null }).language_code) || 'en';
      const missions = await db
        .collection('missions')
        .find({
          is_active: true,
          $and: [{ $or: [{ starts_at: null }, { starts_at: { $lte: now } }] }, { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] }]
        })
        .toArray();
      const userMissions = await db.collection('user_missions').find({ user_id: new ObjectId(user.id) }).toArray();
      return json(200, {
        missions: missions.map((mission) => ({
          ...mission,
          title: resolveLocalizedText(
            mission.title_i18n as Record<string, unknown> | undefined,
            language,
            mission.title
          ),
          description: resolveLocalizedText(
            mission.description_i18n as Record<string, unknown> | undefined,
            language,
            mission.description
          ),
          id: String(mission._id)
        })),
        user_missions: userMissions.map((mission) => ({ ...mission, id: String(mission._id), mission_id: String(mission.mission_id) }))
      });
    }

    if (event.httpMethod === 'POST') {
      enforceRateLimit(`mission-ip:${event.headers['x-forwarded-for'] || 'unknown'}`, 20, 60_000);
      enforceRateLimit(`mission-user:${user.id}`, 10, 60_000);
      const idem = event.headers['x-idempotency-key'];
      if (!idem) return json(400, { error: 'Missing x-idempotency-key' });

      const { mission_id } = JSON.parse(event.body || '{}');
      if (!ObjectId.isValid(mission_id)) return json(400, { error: 'Invalid mission_id' });

      const mission = await db.collection('missions').findOne({ _id: new ObjectId(mission_id) });
      if (!mission || !mission.is_active) return json(404, { error: 'Mission not found' });

      const existing = await db.collection('ledger').findOne({ idempotency_key: idem });
      if (existing) return json(200, { ok: true, deduped: true });

      if (mission.type === 'join_channel') {
        const channelId = String(mission.payload?.channel_id || process.env.REQUIRED_CHANNEL_ID || '');
        if (!channelId) return json(400, { error: 'No channel configured' });
        const ok = await checkChannelMembership(channelId, user.telegram_user_id);
        if (!ok) return json(400, { error: 'User is not a channel member or bot has insufficient access.' });
      }

      if (mission.type === 'connect_wallet') {
        const userDoc = await db.collection('users').findOne({ _id: new ObjectId(user.id) });
        if (!userDoc?.ton_wallet_address) {
          return json(400, { error: 'Connect TON wallet first.' });
        }
      }

      const reward = mission.reward || {};
      await db.collection('users').updateOne(
        { _id: new ObjectId(user.id) },
        {
          $inc: {
            steps: Number(reward.steps || 0),
            sandwiches: Number(reward.sandwiches || 0),
            coffee: Number(reward.coffee || 0)
          }
        }
      );

      await db.collection('user_missions').updateOne(
        { user_id: new ObjectId(user.id), mission_id: new ObjectId(mission_id) },
        { $set: { status: 'completed', completed_at: new Date() } },
        { upsert: true }
      );

      await db.collection('ledger').insertOne({
        user_id: new ObjectId(user.id),
        kind: 'mission_reward',
        delta_steps: Number(reward.steps || 0),
        delta_sandwiches: Number(reward.sandwiches || 0),
        delta_coffee: Number(reward.coffee || 0),
        idempotency_key: idem,
        meta: { mission_id },
        created_at: new Date()
      });

      return json(200, { ok: true });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    captureException(error, { path: event.path, http_method: event.httpMethod });
    return json(401, { error: (error as Error).message });
  }
};

export const handler = withSentry(baseHandler);
