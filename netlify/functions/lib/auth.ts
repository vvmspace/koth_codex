import type { HandlerEvent } from '@netlify/functions';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { requiredEnv } from './env';
import { getDb } from './db';

const enc = new TextEncoder();

export function verifyTelegramInitData(initData: string) {
  const botToken = requiredEnv('TELEGRAM_BOT_TOKEN');
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('Missing hash');

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) throw new Error('Invalid auth_date');
  if (Math.floor(Date.now() / 1000) - authDate > 86400) throw new Error('initData expired');

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secret).update(dataCheckString).digest();
  const received = Buffer.from(hash, 'hex');

  if (received.length !== computed.length || !crypto.timingSafeEqual(computed, received)) {
    throw new Error('Invalid initData signature');
  }

  const userRaw = params.get('user');
  if (!userRaw) throw new Error('Missing telegram user');
  return JSON.parse(userRaw) as {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  };
}

export async function signSession(payload: { user_id: string; telegram_user_id: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(enc.encode(requiredEnv('JWT_SECRET')));
}

export async function requireUser(event: HandlerEvent) {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header?.startsWith('Bearer ')) throw new Error('Missing bearer token');
  const token = header.slice(7);
  const verified = await jwtVerify(token, enc.encode(requiredEnv('JWT_SECRET')));
  const userId = String(verified.payload.user_id || '');
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user token');

  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('User not found');

  return { ...user, id: String(user._id) };
}
