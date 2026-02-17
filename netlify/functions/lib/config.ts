import type { ConfigValues } from '@koth/shared/types';
import { getServiceDb } from './db';

const defaults: ConfigValues = {
  cooldown_ms: 28_800_000,
  max_free_actions_per_day: 3,
  steps_per_wake: 1,
  sandwich_per_ref_action: 1,
  coffee_per_ref2_action: 1
};

export async function loadConfig(): Promise<ConfigValues> {
  const db = getServiceDb();
  const { data } = await db.from('config').select('key,value');
  const map = new Map((data || []).map((r) => [r.key, r.value]));
  return {
    cooldown_ms: Number(map.get('cooldown_ms') ?? defaults.cooldown_ms),
    max_free_actions_per_day: Number(map.get('max_free_actions_per_day') ?? defaults.max_free_actions_per_day),
    steps_per_wake: Number(map.get('steps_per_wake') ?? defaults.steps_per_wake),
    sandwich_per_ref_action: Number(map.get('sandwich_per_ref_action') ?? defaults.sandwich_per_ref_action),
    coffee_per_ref2_action: Number(map.get('coffee_per_ref2_action') ?? defaults.coffee_per_ref2_action)
  };
}
