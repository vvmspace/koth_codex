import type { Db } from 'mongodb';

let activationIndexesReady = false;

export async function ensureActivateWeb3Schema(db: Db) {
  if (activationIndexesReady) return;

  await db.collection('purchases').createIndex({ invoice_id: 1 }, { unique: true, sparse: true });
  await db.collection('purchases').createIndex({ kind: 1, status: 1 });

  activationIndexesReady = true;
}
