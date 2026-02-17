import { MongoClient, type Db, type Document, type ObjectId } from 'mongodb';
import { requiredEnv } from './env';

let clientPromise: Promise<MongoClient> | null = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(requiredEnv('MONGODB_CONNECTION_STRING'));
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB_NAME || 'koth');
}

export function serializeDoc<T extends Document>(doc: T | null): (Omit<T, '_id'> & { _id: string }) | null {
  if (!doc) return null;
  return { ...doc, _id: String(doc._id) } as Omit<T, '_id'> & { _id: string };
}

export function objectIdToString(id: ObjectId | string | null | undefined) {
  return id ? String(id) : null;
}
