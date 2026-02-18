import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const user = await requireUser(event);
  const { item_key, mode } = JSON.parse(event.body || '{}') as { item_key?: 'sandwiches' | 'coffee'; mode?: 'tap' | 'hold' };

  if (!item_key || !['sandwiches', 'coffee'].includes(item_key)) {
    return json(400, { error: 'item_key must be sandwiches or coffee' });
  }

  if (!mode || !['tap', 'hold'].includes(mode)) {
    return json(400, { error: 'mode must be tap or hold' });
  }

  const db = await getDb();
  const objectId = new ObjectId(user.id);
  const balance = Number(user[item_key] || 0);
  if (balance <= 0) {
    return json(400, { error: `${item_key} unavailable` });
  }

  const stepGain = mode === 'hold' ? 2 : 1;

  const updateResult = await db.collection('users').updateOne(
    { _id: objectId, [item_key]: { $gt: 0 } },
    {
      $inc: {
        [item_key]: -1,
        steps: stepGain
      },
      $set: { updated_at: new Date() }
    }
  );

  if (!updateResult.matchedCount) {
    return json(409, { error: `${item_key} unavailable` });
  }

  await db.collection('ledger').insertOne({
    user_id: objectId,
    kind: 'item_use',
    delta_steps: stepGain,
    delta_sandwiches: item_key === 'sandwiches' ? -1 : 0,
    delta_coffee: item_key === 'coffee' ? -1 : 0,
    meta: { item_key, mode },
    created_at: new Date()
  });

  return json(200, { ok: true, item_key, mode, step_gain: stepGain });
};

export const handler = withSentry(baseHandler);
