import type { Db } from 'mongodb';
import { DEFAULT_CHANNEL_ID } from './constants';


const JOIN_CHANNEL_MISSION_FILTER = {
  type: 'join_channel',
  title: 'Join channel'
};

const CONNECT_WALLET_MISSION_FILTER = {
  type: 'connect_wallet',
  title: 'Connect wallet'
};

export async function ensureDefaultMissions(db: Db) {
  const now = new Date();


  await db.collection('missions').updateOne(
    JOIN_CHANNEL_MISSION_FILTER,
    {
      $set: {
        description: 'Join our channel and claim your reward.',
        title_i18n: {
          en: 'Join channel',
          es: 'Unirse al canal'
        },
        description_i18n: {
          en: 'Join our channel and claim your reward.',
          es: 'Únete a nuestro canal y reclama tu recompensa.'
        },
        payload: { channel_id: process.env.REQUIRED_CHANNEL_ID || DEFAULT_CHANNEL_ID },
        reward: { sandwiches: 5 },
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

  await db.collection('missions').updateOne(
    CONNECT_WALLET_MISSION_FILTER,
    {
      $set: {
        description: 'Connect your TON wallet and claim the reward.',
        title_i18n: {
          en: 'Connect wallet',
          es: 'Conectar wallet'
        },
        description_i18n: {
          en: 'Connect your TON wallet and claim the reward.',
          es: 'Conecta tu wallet TON y reclama la recompensa.'
        },
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
