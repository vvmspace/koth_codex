import type { Handler } from '@netlify/functions';
import { ObjectId } from 'mongodb';
import { requireUser } from './lib/auth';
import { getDb } from './lib/db';
import { json } from './lib/http';
import { withSentry, captureException } from './lib/sentry';
import { normalizeSupportedLanguage } from './lib/language';
import { isValidProfileName, normalizeProfileName, profileNameErrorMessage } from './lib/profile-validation';

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
    const firstNameRaw = normalizeProfileName(parsedBody.first_name);
    const languageCodeRaw = typeof parsedBody.language_code === 'string' ? parsedBody.language_code : '';
    const languageCode = normalizeSupportedLanguage(languageCodeRaw);

    if (!isValidProfileName(firstNameRaw)) {
      return json(400, { error: profileNameErrorMessage() });
    }

    if (!languageCode) {
      return json(400, { error: 'language_code must be en or es (regional variants like es-ES are also accepted)' });
    }

    const now = new Date();

    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      {
        $set: {
          first_name: firstNameRaw,
          language_code: languageCode,
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
    const message = (error as Error).message;

    if (message.includes('Missing bearer token') || message.includes('Invalid user token') || message.includes('User not found')) {
      return json(401, { error: message });
    }

    return json(500, { error: message || 'Failed to update user profile' });
  }
};

export const handler = withSentry(baseHandler);
