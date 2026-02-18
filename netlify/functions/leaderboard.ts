import type { Handler } from '@netlify/functions';
import { requireUser } from './lib/auth';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';
import { getDb } from './lib/db';

const baseHandler: Handler = async (event) => {
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

    const [higherCount, totalUsers] = await Promise.all([
      db.collection('users').countDocuments({ steps: { $gt: user.steps } }),
      db.collection('users').countDocuments({})
    ]);

    return json(200, {
      top: top.map((u, idx) => ({
        user_id: String(u._id),
        display_name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Anonymous',
        steps: Number(u.steps || 0),
        rank: idx + 1
      })),
      current_user_rank: higherCount + 1,
      total_users: totalUsers
    });
  } catch (error) {
    captureException(error, { path: event.path, http_method: event.httpMethod });
    return json(401, { error: (error as Error).message });
  }
};

export const handler = withSentry(baseHandler);
