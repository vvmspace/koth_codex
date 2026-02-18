import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';
import { getWakeIntervalMs } from './lib/config';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const db = await getDb();
    const items = await db.collection('user_items').find({ user_id: new ObjectId(user.id) }).toArray();

    const wakeIntervalMs = getWakeIntervalMs();

    return json(200, {
      steps: user.steps,
      sandwiches: user.sandwiches,
      coffee: user.coffee,
      last_awake: user.last_awake ?? null,
      wake_interval_ms: wakeIntervalMs,
      items
    });
  } catch (error) {
    captureException(error, { path: event.path, http_method: event.httpMethod });
    return json(401, { error: (error as Error).message });
  }
};

export const handler = withSentry(baseHandler);
