import type { Handler } from '@netlify/functions';
import { json } from './lib/http';
import { requiredEnv } from './lib/env';
import { getServiceDb } from './lib/db';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (event.headers['x-admin-secret'] !== requiredEnv('ADMIN_SECRET')) return json(403, { error: 'Forbidden' });
  const { telegram_user_id, premium_until } = JSON.parse(event.body || '{}');
  const db = getServiceDb();
  const { error } = await db.from('users').update({ premium_until }).eq('telegram_user_id', telegram_user_id);
  if (error) return json(400, { error: error.message });
  return json(200, { ok: true });
};
