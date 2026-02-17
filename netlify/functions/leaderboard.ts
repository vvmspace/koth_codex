import type { Handler } from '@netlify/functions';
import { getServiceDb } from './lib/db';
import { requireUser } from './lib/auth';
import { json } from './lib/http';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const db = getServiceDb();
    const limit = Math.min(Number(event.queryStringParameters?.limit || 50), 100);

    const { data: top } = await db
      .from('users')
.select('id,first_name,last_name,username,country_flag,steps')
      .order('steps', { ascending: false })
      .limit(limit);

    const { data: rankRows } = await db.rpc('get_user_rank', { p_user_id: user.id });

    return json(200, {
      top: (top || []).map((u, idx) => ({
        user_id: u.id,
        display_name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Anonymous',
        country_flag: u.country_flag ?? null,
        steps: u.steps,
        rank: idx + 1
      })),
      current_user_rank: rankRows?.[0]?.rank ?? null
    });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
