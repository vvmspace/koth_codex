import type { Handler } from '@netlify/functions';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';
import { requiredEnv } from './lib/env';

function assertAdmin(event: Parameters<Handler>[0]) {
  if (event.headers['x-admin-secret'] !== requiredEnv('ADMIN_SECRET')) throw new Error('Forbidden');
}

const baseHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    assertAdmin(event);
    const payload = JSON.parse(event.body || '{}');
    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    const titleI18n = payload.title_i18n && typeof payload.title_i18n === 'object' ? payload.title_i18n : {};
    const descriptionI18n =
      payload.description_i18n && typeof payload.description_i18n === 'object' ? payload.description_i18n : {};

    const normalizedPayload = {
      ...payload,
      title,
      description,
      title_i18n: {
        en: String((titleI18n as { en?: unknown }).en || title),
        ...(titleI18n as Record<string, unknown>)
      },
      description_i18n: {
        en: String((descriptionI18n as { en?: unknown }).en || description),
        ...(descriptionI18n as Record<string, unknown>)
      }
    };

    const db = await getDb();
    const data = await db.collection('missions').insertOne({ ...normalizedPayload, created_at: new Date() });
    const mission = await db.collection('missions').findOne({ _id: data.insertedId });
    return json(200, { mission });
  } catch (error) {
    captureException(error, { path: event.path, http_method: event.httpMethod });
    return json(403, { error: (error as Error).message });
  }
};

export const handler = withSentry(baseHandler);
