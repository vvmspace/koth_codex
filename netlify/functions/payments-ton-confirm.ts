import type { Handler } from '@netlify/functions';
import { requireUser } from './lib/auth';
import { json } from './lib/http';
import { withSentry } from './lib/sentry';

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  await requireUser(event);
  return json(200, { ok: true, message: 'TON confirmation stub. Add on-chain verification later.' });
};

export const handler = withSentry(baseHandler);
