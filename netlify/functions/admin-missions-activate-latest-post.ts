import type { Handler } from '@netlify/functions';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';
import { requiredEnv } from './lib/env';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (event.headers['x-admin-secret'] !== requiredEnv('ADMIN_SECRET')) return json(403, { error: 'Forbidden' });
  const { post_url } = JSON.parse(event.body || '{}');
  if (!post_url) return json(400, { error: 'post_url required' });

  const db = getServiceDb();
  const { data, error } = await db.from('missions').insert({
    type: 'manual_confirm',
    title: 'React/Like latest post',
    description: 'React to the latest post then tap complete.',
    payload: { post_url },
    reward: { steps: 1 },
    is_active: true
  }).select('*').single();
  if (error) return json(400, { error: error.message });
  return json(200, { mission: data, note: 'Stub endpoint created a manual confirm mission for latest post.' });
};
