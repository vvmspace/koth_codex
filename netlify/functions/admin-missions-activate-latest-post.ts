import type { Handler } from '@netlify/functions';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { requiredEnv } from './lib/env';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (event.headers['x-admin-secret'] !== requiredEnv('ADMIN_SECRET')) return json(403, { error: 'Forbidden' });
  const { post_url } = JSON.parse(event.body || '{}');
  if (!post_url) return json(400, { error: 'post_url required' });

  const db = await getDb();
  const result = await db.collection('missions').insertOne({
    type: 'manual_confirm',
    title: 'React/Like latest post',
    description: 'React to the latest post then tap complete.',
    payload: { post_url },
    reward: { steps: 1 },
    is_active: true,
    starts_at: null,
    ends_at: null,
    created_at: new Date()
  });
  const mission = await db.collection('missions').findOne({ _id: result.insertedId });
  return json(200, { mission, note: 'Stub endpoint created a manual confirm mission for latest post.' });
};
