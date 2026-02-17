import type { Handler } from '@netlify/functions';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';
import { signSession, verifyTelegramInitData } from './lib/auth';
import { normalizeLanguageCode, resolveCountryCode } from './lib/geo';

function createReferralCode(telegramUserId: number) {
  return telegramUserId.toString(36);
}

function hasMissingLocaleColumn(message: string) {
  return (
    message.includes("Could not find the 'country_code' column") ||
    message.includes("Could not find the 'language_code' column") ||
    message.includes('column "country_code" does not exist') ||
    message.includes('column "language_code" does not exist')
  );
}

function formatDbError(message: string) {
  if (message.includes("Could not find the table 'public.users'")) {
    return {
      error: 'Database schema is not initialized',
      details:
        'Run supabase/migrations/001_init.sql in your Supabase SQL editor, then verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY point to the same project.'
    };
  }

  if (hasMissingLocaleColumn(message)) {
    return {
      error: 'Database schema is outdated',
      details:
        'Apply latest migrations (including 003_user_country_code.sql / 004_user_locale_guard.sql). On Netlify they run post-deploy; locally run: yarn migrate:deploy.'
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

    const basePayload = {
      telegram_user_id: tgUser.id,
      username: tgUser.username ?? null,
      first_name: tgUser.first_name ?? null,
      last_name: tgUser.last_name ?? null,
      referral_code: createReferralCode(tgUser.id)
    };

    const payloadWithLocale = {
      ...basePayload,
      language_code: normalizeLanguageCode(tgUser.language_code),
      country_code: resolveCountryCode({
        countryCode: netlifyCountryCode,
        languageCode: tgUser.language_code
      })
    };

    let result = await db
      .from('users')
      .upsert(payloadWithLocale, { onConflict: 'telegram_user_id' })
      .select('*')
      .single();

    if (result.error && hasMissingLocaleColumn(result.error.message)) {
      result = await db
        .from('users')
        .upsert(basePayload, { onConflict: 'telegram_user_id' })
        .select('*')
        .single();
    }

    if (result.error || !result.data) {
      return json(500, formatDbError(result.error?.message || 'Failed to upsert user'));
    }

    const token = await signSession({ user_id: result.data.id, telegram_user_id: result.data.telegram_user_id });
    return json(200, { token, user: result.data });
  } catch (error) {
    return json(401, { error: (error as Error).message });
  }
};
