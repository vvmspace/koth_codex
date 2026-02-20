import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';
import { createTonMissionIntent } from './lib/payments-ton';

const DEFAULT_OUTPUT_ADDRESS = 'UQBEGqJqonCwu_jO2IazkJoXTj53F4v2PtuHFaALEtM7CJcX';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = await requireUser(event);
  const { mission_id, amount = 1, currency = 'TON' } = JSON.parse(event.body || '{}');
  const db = await getDb();

  if (mission_id != null) {
    if (!ObjectId.isValid(mission_id)) return json(400, { error: 'Invalid mission_id' });
    const intent = await createTonMissionIntent(db, user.id, mission_id);
    return json(200, intent);
  }

  const outputAddress = process.env.TON_OUTPUT_ADDRESS || DEFAULT_OUTPUT_ADDRESS;
  const data = await db.collection('purchases').insertOne({
    user_id: new ObjectId(user.id),
    provider: 'ton',
    status: 'created',
    amount: String(amount),
    currency,
    meta: { output_address: outputAddress, note: 'Generic TON purchase intent' },
    created_at: new Date()
  });
  const intent = await db.collection('purchases').findOne({ _id: data.insertedId });
  return json(200, { intent, output_address: outputAddress });
};

export const handler = withSentry(baseHandler);
