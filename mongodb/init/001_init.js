const db = db.getSiblingDB(process.env.MONGODB_DB_NAME || 'koth');

const now = new Date();

db.createCollection('users');
db.createCollection('config');
db.createCollection('ledger');
db.createCollection('missions');
db.createCollection('user_missions');
db.createCollection('purchases');
db.createCollection('items');
db.createCollection('user_items');

db.users.createIndex({ telegram_user_id: 1 }, { unique: true });
db.users.createIndex({ referral_code: 1 }, { unique: true });
db.users.createIndex({ steps: -1 });
db.users.createIndex({ referrer_id: 1 });

db.config.createIndex({ key: 1 }, { unique: true });

db.ledger.createIndex({ idempotency_key: 1 }, { unique: true, sparse: true });
db.ledger.createIndex({ user_id: 1, created_at: -1 });

db.missions.createIndex({ is_active: 1 });

db.user_missions.createIndex({ user_id: 1, mission_id: 1 }, { unique: true });
db.user_missions.createIndex({ user_id: 1, status: 1 });

db.purchases.createIndex({ user_id: 1, created_at: -1 });

[
  { key: 'cooldown_ms', value: 28800000 },
  { key: 'steps_per_wake', value: 1 },
  { key: 'sandwiches_per_wake', value: 1 },
  { key: 'coffee_per_wake', value: 1 },
  { key: 'sandwich_per_ref_action', value: 1 },
  { key: 'coffee_per_ref2_action', value: 1 }
].forEach((doc) => {
  db.config.updateOne({ key: doc.key }, { $set: { value: doc.value, updated_at: now } }, { upsert: true });
});


db.missions.updateOne(
  { type: 'connect_wallet', title: 'Connect wallet' },
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
      ends_at: null,
      created_at: now
    }
  },
  { upsert: true }
);


db.missions.updateOne(
  { type: 'join_channel', title: 'Join channel' },
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
      payload: { channel_id: '-1003655493510' },
      reward: { sandwiches: 5 },
      is_active: true,
      starts_at: null,
      ends_at: null,
      created_at: now
    }
  },
  { upsert: true }
);
