import type { Handler } from '@netlify/functions';
import { requireUser } from './lib/auth';
import { json } from './lib/http';
import { getDb } from './lib/db';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const db = await getDb();
    const limit = Math.min(Number(event.queryStringParameters?.limit || 50), 100);

    const top = await db
      .collection('users')
      .find({}, { projection: { first_name: 1, last_name: 1, username: 1, steps: 1 } })
      .sort({ steps: -1, _id: 1 })
      .limit(limit)
      .toArray();

    const higherCount = await db.collection('users').countDocuments({ steps: { $gt: user.steps } });

    return json(200, {
      top: top.map((u, idx) => ({
        user_id: String(u._id),
        display_name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Anonymous',
        steps: Number(u.steps || 0),
        rank: idx + 1
      })),
      current_user_rank: higherCount + 1
    });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
