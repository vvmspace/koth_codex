import type { Handler } from '@netlify/functions';
import { verifyTelegramInitData, signSession } from './lib/auth';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';
import { getDb } from './lib/db';

function createReferralCode(telegramUserId: number) {
  return telegramUserId.toString(36);
}


const baseHandler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method not allowed. Use POST /api/auth/telegram' });
    }

    const parsedBody = JSON.parse(event.body || '{}');
    const initData =
      parsedBody?.initData ||
      parsedBody?.init_data ||
      event.queryStringParameters?.initData ||
      event.queryStringParameters?.init_data;

    if (!initData) return json(400, { error: 'initData required' });

    const tgUser = verifyTelegramInitData(initData);
    const db = await getDb();
    const now = new Date();

    await db.collection('users').updateOne(
      { telegram_user_id: tgUser.id },
      {
        $set: {
          username: tgUser.username ?? null,
          last_name: tgUser.last_name ?? null,
          updated_at: now
        },
        $setOnInsert: {
          first_name: tgUser.first_name ?? null,
          language_code: tgUser.language_code ?? null,
          referral_code: createReferralCode(tgUser.id),
          referrer_id: null,
          steps: 0,
          sandwiches: 0,
          coffee: 0,
          premium_until: null,
          last_awake: null,
          ton_wallet_address: null,
          created_at: now
        }
      },
      { upsert: true }
    );

    const user = await db.collection('users').findOne({ telegram_user_id: tgUser.id });
    if (!user) return json(500, { error: 'Failed to upsert user' });

    const token = await signSession({ user_id: String(user._id), telegram_user_id: user.telegram_user_id });
    return json(200, { token, user: { ...user, id: String(user._id) } });
  } catch (error) {
    captureException(error, { path: event.path, http_method: event.httpMethod });
    return json(401, { error: (error as Error).message });
  }
};

export const handler = withSentry(baseHandler);
