import type { Handler } from '@netlify/functions';
import { requireUser } from './lib/auth';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const user = await requireUser(event);
  const { amount = 1, currency = 'TON' } = JSON.parse(event.body || '{}');
  const db = getServiceDb();
  const { data, error } = await db.from('purchases').insert({
    user_id: user.id,
    provider: 'ton',
    status: 'created',
    amount,
    currency,
    meta: { note: 'Scaffold intent only' }
  }).select('*').single();
  if (error) return json(400, { error: error.message });
  return json(200, { intent: data });
};
