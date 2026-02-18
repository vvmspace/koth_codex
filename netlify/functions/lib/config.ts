import type { ConfigValues } from '@koth/shared/types';
import { getDb } from './db';

const defaults: ConfigValues = {
  steps_per_wake: 1,
  sandwiches_per_wake: 1,
  coffee_per_wake: 1,
  sandwich_per_ref_action: 1,
  coffee_per_ref2_action: 1
};

export async function loadConfig(): Promise<ConfigValues> {
  const db = await getDb();
  const rows = await db.collection('config').find({ key: { $in: Object.keys(defaults) } }).toArray();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    steps_per_wake: Number(map.get('steps_per_wake') ?? defaults.steps_per_wake),
    sandwiches_per_wake: Number(map.get('sandwiches_per_wake') ?? defaults.sandwiches_per_wake),
    coffee_per_wake: Number(map.get('coffee_per_wake') ?? defaults.coffee_per_wake),
    sandwich_per_ref_action: Number(map.get('sandwich_per_ref_action') ?? defaults.sandwich_per_ref_action),
    coffee_per_ref2_action: Number(map.get('coffee_per_ref2_action') ?? defaults.coffee_per_ref2_action)
  };
}

export function getWakeIntervalMs(): number {
  const raw = process.env.WAKE_INTERVAL_MS;
  const parsed = Number(raw);
  if (!raw || !Number.isFinite(parsed) || parsed <= 0) {
    return 28_800_000;
  }
  return parsed;
}
