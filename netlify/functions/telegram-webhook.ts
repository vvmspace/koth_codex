import type { Handler } from '@netlify/functions';
import { Bot, InlineKeyboard } from 'grammy';
import { getServiceDb } from './lib/db';
import { json } from './lib/http';
import { requiredEnv } from './lib/env';
import { normalizeLanguageCode } from './lib/geo';

const bot = new Bot(requiredEnv('TELEGRAM_BOT_TOKEN'));

function isMissingUsersLocaleColumnError(message: string) {
  return (
    message.includes("Could not find the column 'language_code' of 'users'") ||
    message.includes("Could not find the 'language_code' column of 'users'")
  );
}

function parseRefCode(text?: string) {
  if (!text) return null;
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const ref = parts[1];
  return ref.startsWith('ref_') ? ref.slice(4) : null;
}

bot.command('start', async (ctx) => {
  const appUrl = requiredEnv('APP_BASE_URL');
  const refCode = parseRefCode(ctx.message?.text);
  const db = getServiceDb();
  const telegramUser = ctx.from;
  const referral_code = telegramUser.id.toString(36);

  const { data: existing } = await db.from('users').select('*').eq('telegram_user_id', telegramUser.id).maybeSingle();
  if (!existing) {
    let referrer_id: string | null = null;
    if (refCode) {
      const { data: referrer } = await db.from('users').select('id').eq('referral_code', refCode).maybeSingle();
      referrer_id = referrer?.id ?? null;
    }
    let insertResult = await db.from('users').insert({
      telegram_user_id: telegramUser.id,
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_name: telegramUser.last_name ?? null,
      language_code: normalizeLanguageCode(telegramUser.language_code),
      referral_code,
      referrer_id
    });

    if (insertResult.error && isMissingUsersLocaleColumnError(insertResult.error.message)) {
      insertResult = await db.from('users').insert({
        telegram_user_id: telegramUser.id,
        username: telegramUser.username ?? null,
        first_name: telegramUser.first_name ?? null,
        last_name: telegramUser.last_name ?? null,
        referral_code,
        referrer_id
      });
    }

    if (insertResult.error) throw insertResult.error;
  }

  const keyboard = new InlineKeyboard().webApp('Open Mini App', appUrl);
  await ctx.reply('Welcome to King of the Hill! Tap to play.', { reply_markup: keyboard });
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  await bot.handleUpdate(JSON.parse(event.body || '{}'));
  return json(200, { ok: true });
};
