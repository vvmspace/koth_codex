import { MongoClient, type Db, type Document, type ObjectId } from 'mongodb';
import { requiredEnv } from './env';
import { trackDbDuration } from './request-trace';

let clientPromise: Promise<MongoClient> | null = null;

function wrapInstrumentedObject<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      if (typeof original !== 'function') return original;

      return (...args: unknown[]) => {
        const result = original.apply(target, args);

        if (!result || typeof result.then !== 'function') {
          return typeof result === 'object' && result !== null ? wrapInstrumentedObject(result) : result;
        }

        const startedAt = Date.now();

        return result.finally(() => {
          trackDbDuration(Date.now() - startedAt);
        });
      };
    }
  });
}

function getClient() {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(requiredEnv('MONGODB_CONNECTION_STRING'));
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  const db = client.db(process.env.MONGODB_DB_NAME || 'koth');

  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop !== 'collection') {
        return Reflect.get(target, prop, receiver);
      }

      const originalCollection = Reflect.get(target, prop, receiver).bind(target) as Db['collection'];

      return (...args: Parameters<Db['collection']>) => {
        const collection = originalCollection(...args);
        return new Proxy(collection, {
          get(collectionTarget, collectionProp, collectionReceiver) {
            const original = Reflect.get(collectionTarget, collectionProp, collectionReceiver);
            if (typeof original !== 'function') return original;

            return (...methodArgs: unknown[]) => {
              const result = original.apply(collectionTarget, methodArgs);

              if (!result || typeof result.then !== 'function') {
                return typeof result === 'object' && result !== null ? wrapInstrumentedObject(result) : result;
              }

              const startedAt = Date.now();

              return result.finally(() => {
                trackDbDuration(Date.now() - startedAt);
              });
            };
          }
        });
      };
    }
  }) as Db;
}

export function serializeDoc<T extends Document>(doc: T | null): (Omit<T, '_id'> & { _id: string }) | null {
  if (!doc) return null;
  return { ...doc, _id: String(doc._id) } as Omit<T, '_id'> & { _id: string };
}

export function objectIdToString(id: ObjectId | string | null | undefined) {
  return id ? String(id) : null;
}
