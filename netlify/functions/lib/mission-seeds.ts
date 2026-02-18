import type { Db } from 'mongodb';

const CONNECT_WALLET_MISSION_FILTER = {
  type: 'connect_wallet',
  title: 'Connect wallet'
};

export async function ensureDefaultMissions(db: Db) {
  const now = new Date();

  await db.collection('missions').updateOne(
    CONNECT_WALLET_MISSION_FILTER,
    {
      $set: {
        description: 'Connect your TON wallet and claim the reward.',
        payload: {},
        reward: { sandwiches: 50, coffee: 50 },
        is_active: true,
        starts_at: null,
        ends_at: null
      },
      $setOnInsert: {
        created_at: now
      }
    },
    { upsert: true }
  );
}
