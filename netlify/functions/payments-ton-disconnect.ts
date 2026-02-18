import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = await requireUser(event);
  const db = await getDb();

  await db.collection('users').updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { ton_wallet_address: null, updated_at: new Date() } }
  );

  return json(200, { ok: true });
};

export const handler = withSentry(baseHandler);
