import type { Handler } from '@netlify/functions';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';
import { requiredEnv } from './lib/env';
import { getDb } from './lib/db';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (event.headers['x-admin-secret'] !== requiredEnv('ADMIN_SECRET')) return json(403, { error: 'Forbidden' });
  const { telegram_user_id, premium_until } = JSON.parse(event.body || '{}');
  const db = await getDb();
  const result = await db.collection('users').updateOne(
    { telegram_user_id: Number(telegram_user_id) },
    { $set: { premium_until: premium_until ? new Date(premium_until) : null, updated_at: new Date() } }
  );
  if (!result.matchedCount) return json(404, { error: 'User not found' });
  return json(200, { ok: true });
};

export const handler = withSentry(baseHandler);
