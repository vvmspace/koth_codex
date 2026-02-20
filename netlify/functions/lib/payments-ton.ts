import { ObjectId, type Db } from 'mongodb';
import { requiredEnv } from './env';
import { sendTelegramNotification } from './telegram';

const DEFAULT_OUTPUT_ADDRESS = 'UQBEGqJqonCwu_jO2IazkJoXTj53F4v2PtuHFaALEtM7CJcX';
const DEFAULT_AMOUNT_TON = '1';

export type TonVerificationStatus = 'confirmed' | 'pending' | 'declined';

export type TonVerificationResult = {
  status: TonVerificationStatus;
  reason?: string;
  confirmations?: number;
  amountTon?: number;
};

function normalizeAddress(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function parseTonAmount(rawAmount: unknown): number {
  if (typeof rawAmount === 'number') return rawAmount;
  if (typeof rawAmount === 'string') return Number(rawAmount);
  return Number.NaN;
}

function resolveTonApiUrl(txId: string): string {
  const base = process.env.TON_API_BASE_URL || 'https://ton.kingofthehill.pro';
  return `${base.replace(/\/$/, '')}/v2/blockchain/transactions/${encodeURIComponent(txId)}`;
}

export async function verifyTonTransaction(params: {
  transactionId: string;
  expectedFromAddress: string;
  expectedToAddress: string;
  expectedAmountTon: number;
  minConfirmations: number;
}): Promise<TonVerificationResult> {
  const response = await fetch(resolveTonApiUrl(params.transactionId), {
    headers: process.env.TON_API_KEY ? { Authorization: `Bearer ${process.env.TON_API_KEY}` } : undefined
  });

  if (!response.ok) {
    return { status: 'pending', reason: `ton_api_unavailable:${response.status}` };
  }

  const tx = (await response.json()) as Record<string, unknown>;
  const inMsg = (tx.in_msg || tx.inMessage || {}) as Record<string, unknown>;
  const value = parseTonAmount(inMsg.value ?? inMsg.amount ?? tx.value ?? tx.amount);
  const fromAddress = normalizeAddress(String((inMsg.source as string) || (inMsg.src as string) || tx.account || ''));
  const toAddress = normalizeAddress(String((inMsg.destination as string) || (inMsg.dst as string) || tx.address || ''));

  const confirmationsRaw = tx.confirmations ?? tx.confirmation_count ?? 0;
  const confirmations = Number(confirmationsRaw);
  const expectedFrom = normalizeAddress(params.expectedFromAddress);
  const expectedTo = normalizeAddress(params.expectedToAddress);

  if (!Number.isFinite(value)) {
    return { status: 'pending', reason: 'invalid_amount_in_tx' };
  }

  if (fromAddress !== expectedFrom) {
    return { status: 'declined', reason: 'invalid_sender', amountTon: value, confirmations };
  }

  if (toAddress !== expectedTo) {
    return { status: 'declined', reason: 'invalid_recipient', amountTon: value, confirmations };
  }

  if (value < params.expectedAmountTon) {
    return { status: 'declined', reason: 'insufficient_amount', amountTon: value, confirmations };
  }

  if (!Number.isFinite(confirmations) || confirmations < params.minConfirmations) {
    return { status: 'pending', reason: 'confirmations_pending', amountTon: value, confirmations: Number.isFinite(confirmations) ? confirmations : 0 };
  }

  return { status: 'confirmed', amountTon: value, confirmations };
}

export async function createTonMissionIntent(db: Db, userId: string, missionId: string) {
  const outputAddress = process.env.TON_OUTPUT_ADDRESS || DEFAULT_OUTPUT_ADDRESS;
  const amountTon = process.env.ACTIVATE_WEB3_AMOUNT_TON || DEFAULT_AMOUNT_TON;
  const userObjectId = new ObjectId(userId);
  const missionObjectId = new ObjectId(missionId);

  const insertResult = await db.collection('purchases').insertOne({
    user_id: userObjectId,
    mission_id: missionObjectId,
    provider: 'ton',
    status: 'created',
    amount: String(amountTon),
    currency: 'TON',
    meta: {
      output_address: outputAddress,
      item_key: 'activate_web3'
    },
    created_at: new Date()
  });

  return {
    intent_id: String(insertResult.insertedId),
    output_address: outputAddress,
    amount_ton: amountTon
  };
}

export async function claimTonMissionReward(params: {
  db: Db;
  userId: string;
  telegramUserId: number;
  missionId: string;
  transactionId: string;
  walletAddress: string;
  idempotencyKey: string;
}) {
  const minConfirmations = Number(process.env.TON_MIN_CONFIRMATIONS || '1');
  const outputAddress = process.env.TON_OUTPUT_ADDRESS || DEFAULT_OUTPUT_ADDRESS;
  const amountTon = Number(process.env.ACTIVATE_WEB3_AMOUNT_TON || DEFAULT_AMOUNT_TON);

  const verification = await verifyTonTransaction({
    transactionId: params.transactionId,
    expectedFromAddress: params.walletAddress,
    expectedToAddress: outputAddress,
    expectedAmountTon: amountTon,
    minConfirmations
  });

  const userObjectId = new ObjectId(params.userId);
  const missionObjectId = new ObjectId(params.missionId);
  const now = new Date();

  if (verification.status === 'pending') {
    await params.db.collection('purchases').insertOne({
      user_id: userObjectId,
      mission_id: missionObjectId,
      provider: 'ton',
      status: 'pending',
      amount: String(amountTon),
      currency: 'TON',
      meta: {
        output_address: outputAddress,
        tx_id: params.transactionId,
        wallet_address: params.walletAddress,
        reason: verification.reason,
        confirmations: verification.confirmations ?? 0
      },
      created_at: now
    });

    return { ok: false, status: 'pending' as const, verification };
  }

  if (verification.status === 'declined') {
    await params.db.collection('purchases').insertOne({
      user_id: userObjectId,
      mission_id: missionObjectId,
      provider: 'ton',
      status: 'failed',
      amount: String(amountTon),
      currency: 'TON',
      meta: {
        output_address: outputAddress,
        tx_id: params.transactionId,
        wallet_address: params.walletAddress,
        reason: verification.reason,
        confirmations: verification.confirmations ?? 0
      },
      created_at: now
    });

    await params.db.collection('user_missions').deleteOne({ user_id: userObjectId, mission_id: missionObjectId, status: 'pending' });
    await sendTelegramNotification(params.telegramUserId, `❌ TON payment declined (${verification.reason || 'validation_failed'}). You can start Activate Web3 mission again.`);

    return { ok: false, status: 'declined' as const, verification };
  }

  const mission = await params.db.collection('missions').findOne({ _id: missionObjectId });
  const reward = mission?.reward || {};

  const userMission = await params.db.collection('user_missions').findOne({ user_id: userObjectId, mission_id: missionObjectId });
  if (userMission?.status === 'completed') {
    return { ok: true, status: 'confirmed' as const, already_completed: true };
  }

  await params.db.collection('users').updateOne(
    { _id: userObjectId },
    {
      $inc: {
        steps: Number(reward.steps || 0),
        sandwiches: Number(reward.sandwiches || 0),
        coffee: Number(reward.coffee || 0)
      },
      $set: { updated_at: now }
    }
  );

  await params.db.collection('user_missions').updateOne(
    { user_id: userObjectId, mission_id: missionObjectId },
    {
      $setOnInsert: { user_id: userObjectId, mission_id: missionObjectId },
      $set: { status: 'completed', completed_at: now }
    },
    { upsert: true }
  );

  await params.db.collection('ledger').insertOne({
    user_id: userObjectId,
    kind: 'mission_reward',
    delta_steps: Number(reward.steps || 0),
    delta_sandwiches: Number(reward.sandwiches || 0),
    delta_coffee: Number(reward.coffee || 0),
    idempotency_key: params.idempotencyKey,
    meta: { mission_id: params.missionId, tx_id: params.transactionId, provider: 'ton' },
    created_at: now
  });

  await params.db.collection('purchases').insertOne({
    user_id: userObjectId,
    mission_id: missionObjectId,
    provider: 'ton',
    status: 'confirmed',
    amount: String(amountTon),
    currency: 'TON',
    meta: {
      output_address: outputAddress,
      tx_id: params.transactionId,
      wallet_address: params.walletAddress,
      confirmations: verification.confirmations ?? minConfirmations
    },
    created_at: now
  });

  await sendTelegramNotification(params.telegramUserId, `✅ Activate Web3 payment confirmed. Reward was credited to your account.`);

  return { ok: true, status: 'confirmed' as const, verification };
}
