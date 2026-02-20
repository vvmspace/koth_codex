import { requiredEnv } from './env';

export async function sendTelegramNotification(telegramUserId: number, text: string): Promise<void> {
  const token = requiredEnv('TELEGRAM_BOT_TOKEN');
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramUserId,
      text,
      disable_web_page_preview: true
    })
  });
}
