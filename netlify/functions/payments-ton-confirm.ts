import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';
import { claimTonMissionReward } from './lib/payments-ton';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = await requireUser(event);
  const idem = event.headers['x-idempotency-key'];
  if (!idem) return json(400, { error: 'Missing x-idempotency-key' });

  const { mission_id, transaction_id, wallet_address } = JSON.parse(event.body || '{}');
  if (!ObjectId.isValid(mission_id)) return json(400, { error: 'Invalid mission_id' });
  if (typeof transaction_id !== 'string' || transaction_id.trim().length < 8) {
    return json(400, { error: 'Invalid transaction_id' });
  }
  if (typeof wallet_address !== 'string' || wallet_address.trim().length < 16) {
    return json(400, { error: 'Invalid wallet_address' });
  }

  const db = await getDb();

  const mission = await db.collection('missions').findOne({ _id: new ObjectId(mission_id) });
  if (!mission || !mission.is_active || mission.type !== 'ton_payment') {
    return json(404, { error: 'TON payment mission not found' });
  }

  const existingLedger = await db.collection('ledger').findOne({ idempotency_key: idem });
  if (existingLedger) {
    return json(200, { ok: true, deduped: true, status: 'confirmed' });
  }

  const result = await claimTonMissionReward({
    db,
    userId: user.id,
    telegramUserId: user.telegram_user_id,
    missionId: mission_id,
    transactionId: transaction_id.trim(),
    walletAddress: wallet_address.trim(),
    idempotencyKey: idem
  });

  return json(200, result);
};

export const handler = withSentry(baseHandler);
