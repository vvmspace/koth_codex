import type { Handler } from '@netlify/functions';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';
import { signSession, verifyTelegramInitData } from './lib/auth';

function createReferralCode(telegramUserId: number) {
  return telegramUserId.toString(36);
}

function normalizeLanguageCode(languageCode?: string) {
  if (!languageCode) return null;
  return languageCode.toLowerCase();
}

function countryCodeToFlag(countryCode?: string | null) {
  if (!countryCode || !/^[a-z]{2}$/i.test(countryCode)) return null;
  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function formatDbError(message: string) {
  if (message.includes("Could not find the table 'public.users'")) {
    return {
      error: 'Database schema is not initialized',
      details:
        'Run supabase/migrations/001_init.sql in your Supabase SQL editor, then verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY point to the same project.'
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

    const netlifyCountryCode =
      event.headers['x-country'] ||
      event.headers['X-Country'] ||
      event.headers['x-nf-geo-country'];

    const payload = {
      telegram_user_id: tgUser.id,
      username: tgUser.username ?? null,
      first_name: tgUser.first_name ?? null,
      last_name: tgUser.last_name ?? null,
      language_code: normalizeLanguageCode(tgUser.language_code),
      country_flag: countryCodeToFlag(netlifyCountryCode),
      referral_code: createReferralCode(tgUser.id)
    };

    const { data: user, error } = await db
      .from('users')
      .upsert(payload, { onConflict: 'telegram_user_id' })
      .select('*')
      .single();

    if (error || !user) return json(500, formatDbError(error?.message || 'Failed to upsert user'));

    const token = await signSession({ user_id: user.id, telegram_user_id: user.telegram_user_id });
    return json(200, { token, user });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
