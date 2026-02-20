import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';

const TON_USER_FRIENDLY_ADDRESS_REGEX = /^(EQ|UQ)[A-Za-z0-9_-]{46,64}$/;
const TON_RAW_ADDRESS_REGEX = /^-?\d+:[A-Fa-f0-9]{64}$/;

function normalizeTonWalletAddress(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;
  if (TON_USER_FRIENDLY_ADDRESS_REGEX.test(value) || TON_RAW_ADDRESS_REGEX.test(value)) {
    return value;
  }
  return null;
}

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = await requireUser(event);
  const { wallet_address } = JSON.parse(event.body || '{}');
  const normalizedWalletAddress = normalizeTonWalletAddress(wallet_address);

  if (!normalizedWalletAddress) {
    return json(400, { error: 'Invalid TON wallet address' });
  }

  const db = await getDb();

  await db.collection('users').updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { ton_wallet_address: normalizedWalletAddress, updated_at: new Date() } }
  );

  return json(200, { ok: true, wallet_address: normalizedWalletAddress });
};

export const handler = withSentry(baseHandler);
