import type { Handler } from '@netlify/functions';
import { getDb } from './lib/db';
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
    const db = await getDb();
    const data = await db.collection('missions').insertOne({ ...payload, created_at: new Date() });
    const mission = await db.collection('missions').findOne({ _id: data.insertedId });
    return json(200, { mission });
  } catch (error) {
    return json(403, { error: (error as Error).message });
  }
};
