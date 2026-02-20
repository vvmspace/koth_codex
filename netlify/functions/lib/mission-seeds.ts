import type { Db } from 'mongodb';
import { TELEGRAM_CHANNEL_ID } from './constants';


const JOIN_CHANNEL_MISSION_FILTER = {
  type: 'join_channel',
  title: 'Join channel'
};

const CONNECT_WALLET_MISSION_FILTER = {
  type: 'connect_wallet',
  title: 'Connect wallet'
};

const ACTIVATE_WEB3_MISSION_FILTER = {
  type: 'manual_confirm',
  title: 'Activate Web3'
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
        payload: { channel_id: process.env.TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_ID },
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

  await db.collection('missions').updateOne(
    ACTIVATE_WEB3_MISSION_FILTER,
    {
      $set: {
        description: 'Send 1 TON to the output address and claim your reward.',
        title_i18n: {
          en: 'Activate Web3',
          es: 'Activar Web3'
        },
        description_i18n: {
          en: 'Payment: 1 TON to TON_OUTPUT_ADDRESS. Reward: 100 sandwiches and 100 coffee.',
          es: 'Pago: 1 TON a TON_OUTPUT_ADDRESS. Recompensa: 100 sándwiches y 100 cafés.'
        },
        payload: {
          amount_ton: '1',
          output_address: process.env.TON_OUTPUT_ADDRESS || 'UQBEGqJqonCwu_jO2IazkJoXTj53F4v2PtuHFaALEtM7CJcX'
        },
        reward: { sandwiches: 100, coffee: 100 },
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
