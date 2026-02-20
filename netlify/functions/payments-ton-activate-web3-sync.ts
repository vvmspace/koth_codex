import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { requiredEnv } from './lib/env';
import { json } from './lib/http';
import { ensureActivateWeb3Schema } from './lib/activation-web3';
import { withSentry } from './lib/sentry';

type TonV2Transaction = {
  transaction_id?: { lt?: string; hash?: string };
  in_msg?: {
    destination?: string;
    value?: string;
    message?: string;
    msg_data?: { text?: string };
  };
};

function normalizeEndpoint(endpoint: string) {
  return endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
}

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

function extractComment(tx: TonV2Transaction): string | null {
  const text = tx.in_msg?.message || tx.in_msg?.msg_data?.text;
  return typeof text === 'string' ? text : null;
}

async function fetchTransactions(endpoint: string, receiver: string): Promise<TonV2Transaction[]> {
  const url = `${normalizeEndpoint(endpoint)}/v2/getTransactions?address=${encodeURIComponent(receiver)}&limit=50`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TON API request failed with status ${response.status}`);
  }

  const body = await response.json() as { ok?: boolean; result?: TonV2Transaction[] };
  if (body.ok === false) {
    throw new Error('TON API returned an error');
  }

  if (!Array.isArray(body.result)) {
    return [];
  }

  return body.result;
}

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = await requireUser(event);
  const { invoice_id: invoiceId } = JSON.parse(event.body || '{}') as { invoice_id?: string };
  if (!invoiceId || typeof invoiceId !== 'string') {
    return json(400, { error: 'invoice_id is required' });
  }

  const endpoint = requiredEnv('TON_API_V4_ENDPOINT');
  const db = await getDb();
  await ensureActivateWeb3Schema(db);
  const userObjectId = new ObjectId(user.id);

  const purchase = await db.collection('purchases').findOne({
    user_id: userObjectId,
    kind: 'activate_web3',
    invoice_id: invoiceId
  });

  if (!purchase) {
    return json(404, { error: 'Activation invoice not found' });
  }

  if (purchase.status === 'paid') {
    return json(200, { ok: true, status: 'paid', invoice_id: invoiceId });
  }

  const transactions = await fetchTransactions(endpoint, String(purchase.receiver));
  const receiver = normalizeAddress(String(purchase.receiver));
  const requiredAmount = BigInt(String(purchase.amount_nano));

  const match = transactions.find((tx) => {
    const destination = tx.in_msg?.destination;
    const value = tx.in_msg?.value;
    const comment = extractComment(tx);
    if (!destination || !value || !comment) return false;
    if (normalizeAddress(destination) !== receiver) return false;
    if (comment !== purchase.comment) return false;

    try {
      return BigInt(value) >= requiredAmount;
    } catch {
      return false;
    }
  });

  if (!match) {
    return json(200, { ok: true, status: 'pending', invoice_id: invoiceId });
  }

  const paidAt = new Date();
  const txLt = match.transaction_id?.lt || null;
  const txHash = match.transaction_id?.hash || null;

  const updateResult = await db.collection('purchases').updateOne(
    { _id: purchase._id, status: 'pending' },
    {
      $set: {
        status: 'paid',
        tx_lt: txLt,
        tx_hash: txHash,
        paid_at: paidAt,
        updated_at: paidAt
      }
    }
  );

  if (updateResult.matchedCount === 1) {
    await db.collection('users').updateOne(
      { _id: userObjectId, web3_activated_at: { $exists: false } },
      {
        $set: {
          web3_activated_at: paidAt,
          web3_activation_invoice_id: invoiceId,
          updated_at: paidAt
        }
      }
    );

    await db.collection('users').updateOne(
      { _id: userObjectId, web3_activated_at: { $exists: true } },
      { $set: { web3_activation_invoice_id: invoiceId, updated_at: paidAt } }
    );
  }

  return json(200, { ok: true, status: 'paid', invoice_id: invoiceId });
};

export const handler = withSentry(baseHandler);
