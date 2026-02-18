import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';

const SUPPORTED_LANGUAGES = new Set(['en', 'es']);

const baseHandler: Handler = async (event) => {
  try {
    const user = await requireUser(event);
    const db = await getDb();

    if (event.httpMethod === 'GET') {
      return json(200, { user });
    }

    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method not allowed' });
    }

    const parsedBody = JSON.parse(event.body || '{}');
    const firstNameRaw = typeof parsedBody.first_name === 'string' ? parsedBody.first_name.trim() : '';
    const languageCodeRaw = typeof parsedBody.language_code === 'string' ? parsedBody.language_code.trim().toLowerCase() : '';

    if (!firstNameRaw) {
      return json(400, { error: 'first_name is required' });
    }

    if (!SUPPORTED_LANGUAGES.has(languageCodeRaw)) {
      return json(400, { error: 'language_code must be en or es' });
    }

    const now = new Date();

    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      {
        $set: {
          first_name: firstNameRaw,
          language_code: languageCodeRaw,
          updated_at: now
        }
      }
    );

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(user.id) });
    if (!updatedUser) {
      return json(500, { error: 'Failed to update user profile' });
    }

    return json(200, { user: { ...updatedUser, id: String(updatedUser._id) } });
  } catch (error) {
    captureException(error, { path: event.path, http_method: event.httpMethod });
    return json(401, { error: (error as Error).message });
  }
};

export const handler = withSentry(baseHandler);
