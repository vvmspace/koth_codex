import crypto from 'node:crypto';
import type { Handler } from '@netlify/functions';
import { beginCell } from '@ton/core';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { requiredEnv } from './lib/env';
import { json } from './lib/http';
import { ensureActivateWeb3Schema } from './lib/activation-web3';
import { withSentry } from './lib/sentry';

function tonToNano(ton: string): string {
  const trimmed = ton.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('Invalid TON amount format');
  }

  const [wholeRaw, fractionRaw = ''] = trimmed.split('.');
  if (fractionRaw.length > 9) {
    throw new Error('TON amount supports up to 9 decimal places');
  }

  const whole = BigInt(wholeRaw);
  const fraction = BigInt(fractionRaw.padEnd(9, '0'));
  return (whole * 1_000_000_000n + fraction).toString();
}

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = await requireUser(event);
  const receiver = requiredEnv('TON_OUT_ADDRESS');
  const amountTon = requiredEnv('TON_ACTIVATE_AMOUNT');
  requiredEnv('TON_API_V4_ENDPOINT');

  let amountNano: string;
  try {
    amountNano = tonToNano(amountTon);
  } catch (error) {
    return json(400, { error: (error as Error).message });
  }

  const invoiceId = crypto.randomUUID();
  const comment = `KOTH_ACTIVATE:${user.id}:${invoiceId}`;
  const payloadBocBase64 = beginCell().storeUint(0, 32).storeStringTail(comment).endCell().toBoc().toString('base64');
  const now = new Date();

  const db = await getDb();
  await ensureActivateWeb3Schema(db);
  await db.collection('purchases').insertOne({
    user_id: new ObjectId(user.id),
    provider: 'ton',
    kind: 'activate_web3',
    invoice_id: invoiceId,
    receiver,
    amount_ton: amountTon,
    amount_nano: amountNano,
    comment,
    status: 'pending',
    created_at: now,
    updated_at: now,
    meta: {
      ton_api_v4_endpoint: process.env.TON_API_V4_ENDPOINT
    }
  });

  return json(200, {
    ok: true,
    invoice_id: invoiceId,
    receiver,
    amount_ton: amountTon,
    amount_nano: amountNano,
    comment,
    transaction: {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [{ address: receiver, amount: amountNano, payload: payloadBocBase64 }]
    }
  });
};

export const handler = withSentry(baseHandler);
