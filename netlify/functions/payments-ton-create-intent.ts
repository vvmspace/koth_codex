import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const user = await requireUser(event);
  const { amount = 1, currency = 'TON' } = JSON.parse(event.body || '{}');
  const db = await getDb();
  const data = await db.collection('purchases').insertOne({
    user_id: new ObjectId(user.id),
    provider: 'ton',
    status: 'created',
    amount: String(amount),
    currency,
    meta: { note: 'Scaffold intent only' },
    created_at: new Date()
  });
  const intent = await db.collection('purchases').findOne({ _id: data.insertedId });
  return json(200, { intent });
};

export const handler = withSentry(baseHandler);
