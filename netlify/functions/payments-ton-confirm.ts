import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';

const TON_ADDRESS_REGEX = /^(EQ|UQ)[A-Za-z0-9_-]{46,48}$/;

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = await requireUser(event);
  const { wallet_address } = JSON.parse(event.body || '{}');

  if (!wallet_address || typeof wallet_address !== 'string' || !TON_ADDRESS_REGEX.test(wallet_address)) {
    return json(400, { error: 'Invalid TON wallet address' });
  }

  const db = await getDb();

  await db.collection('users').updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { ton_wallet_address: wallet_address, updated_at: new Date() } }
  );

  return json(200, { ok: true, wallet_address });
};

export const handler = withSentry(baseHandler);
