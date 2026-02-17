import type { Handler } from '@netlify/functions';
import { Bot, InlineKeyboard } from 'grammy';
import { json } from './lib/http';
import { requiredEnv } from './lib/env';
import { getDb } from './lib/db';

const bot = new Bot(requiredEnv('TELEGRAM_BOT_TOKEN'));

function parseRefCode(text?: string) {
  if (!text) return null;
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const ref = parts[1];
  return ref.startsWith('ref_') ? ref.slice(4) : null;
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

bot.command('start', async (ctx) => {
  const appUrl = requiredEnv('APP_BASE_URL');
  const refCode = parseRefCode(ctx.message?.text);
  const db = await getDb();
  const telegramUser = ctx.from;

  const existing = await db.collection('users').findOne({ telegram_user_id: telegramUser.id });
  if (!existing) {
    let referrerId = null;
    if (refCode) {
      const referrer = await db.collection('users').findOne({ referral_code: refCode }, { projection: { _id: 1 } });
      referrerId = referrer?._id ?? null;
    }

    await db.collection('users').insertOne({
      telegram_user_id: telegramUser.id,
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_name: telegramUser.last_name ?? null,
      referral_code: telegramUser.id.toString(36),
      referrer_id: referrerId,
      steps: 0,
      sandwiches: 0,
      coffee: 0,
      premium_until: null,
      next_available_at: new Date(),
      daily_free_count: 0,
      daily_free_reset_date: todayUtc(),
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  const keyboard = new InlineKeyboard().webApp('Open Mini App', appUrl);
  await ctx.reply('Welcome to King of the Hill! Tap to play.', { reply_markup: keyboard });
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  await bot.handleUpdate(JSON.parse(event.body || '{}'));
  return json(200, { ok: true });
};
