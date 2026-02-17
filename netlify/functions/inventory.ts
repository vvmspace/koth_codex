import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const db = await getDb();
    const items = await db.collection('user_items').find({ user_id: new ObjectId(user.id) }).toArray();

    return json(200, {
      steps: user.steps,
      sandwiches: user.sandwiches,
      coffee: user.coffee,
      next_available_at: user.next_available_at,
      daily_free_count: user.daily_free_count,
      items
    });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
