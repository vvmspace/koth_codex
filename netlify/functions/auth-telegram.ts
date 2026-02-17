import type { Handler } from '@netlify/functions';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';
import { signSession, verifyTelegramInitData } from './lib/auth';
import { normalizeLanguageCode } from './lib/geo';

function createReferralCode(telegramUserId: number) {
  return telegramUserId.toString(36);
}

function isMissingUsersLocaleColumnError(message: string) {
  return (
    message.includes("Could not find the column 'language_code' of 'users'") ||
    message.includes("Could not find the 'language_code' column of 'users'") ||
    message.includes("Could not find the column 'country_code' of 'users'") ||
    message.includes("Could not find the 'country_code' column of 'users'")
  );
}

function formatDbError(message: string) {
  if (message.includes("Could not find the table 'public.users'")) {
    return {
      error: 'Database schema is not initialized',
      details:
        'Apply all SQL migrations from supabase/migrations (001..latest), then verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY point to the same project.'
    };
  }

  if (isMissingUsersLocaleColumnError(message)) {
    return {
      error: 'Database schema is out of date',
      details:
        'Apply all SQL migrations from supabase/migrations (001..latest), then restart functions so Supabase schema cache refreshes.'
    };
  }

  return { error: message || 'Database request failed' };
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, {
        error: 'Method not allowed. Use POST /api/auth/telegram with JSON body: {"initData":"..."}'
      });
    }

    const parsedBody = JSON.parse(event.body || '{}');
    const initData =
      parsedBody?.initData ||
      parsedBody?.init_data ||
      event.queryStringParameters?.initData ||
      event.queryStringParameters?.init_data;

    if (!initData) {
      return json(400, {
        error: 'initData required',
        details: 'Send POST JSON body with Telegram WebApp init data: {"initData":"..."}'
      });
    }

    const tgUser = verifyTelegramInitData(initData);
    const db = getServiceDb();

    const basePayload = {
      telegram_user_id: tgUser.id,
      username: tgUser.username ?? null,
      first_name: tgUser.first_name ?? null,
      last_name: tgUser.last_name ?? null,
      referral_code: createReferralCode(tgUser.id)
    };

    let result = await db
      .from('users')
      .upsert({ ...basePayload, language_code: normalizeLanguageCode(tgUser.language_code) }, { onConflict: 'telegram_user_id' })
      .select('*')
      .single();

    if (result.error && isMissingUsersLocaleColumnError(result.error.message)) {
      result = await db.from('users').upsert(basePayload, { onConflict: 'telegram_user_id' }).select('*').single();
    }

    const { data: user, error } = result;
    if (error || !user) return json(500, formatDbError(error?.message || 'Failed to upsert user'));

    const token = await signSession({ user_id: user.id, telegram_user_id: user.telegram_user_id });
    return json(200, { token, user });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
