import type { Handler } from '@netlify/functions';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';
import { requiredEnv } from './lib/env';

function assertAdmin(event: Parameters<Handler>[0]) {
  if (event.headers['x-admin-secret'] !== requiredEnv('ADMIN_SECRET')) throw new Error('Forbidden');
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    assertAdmin(event);
    const payload = JSON.parse(event.body || '{}');
    const db = getServiceDb();
    const { data, error } = await db.from('missions').insert(payload).select('*').single();
    if (error) return json(400, { error: error.message });
    return json(200, { mission: data });
  } catch (error) {
    return json(403, { error: (error as Error).message });
  }
};
