import type { WakeEligibility } from '../types';

export function getWakeEligibility(params: { now: Date; lastAwake: Date | null; wakeIntervalMs: number }): WakeEligibility {
  const { now, lastAwake, wakeIntervalMs } = params;
  if (!lastAwake) {
    return {
      available: true,
      next_available_at: now.toISOString()
    };
  }

  const nextAvailableAt = new Date(lastAwake.getTime() + wakeIntervalMs);
  if (now < nextAvailableAt) {
    return {
      available: false,
      reason: 'cooldown',
      next_available_at: nextAvailableAt.toISOString()
    };
  }

  return {
    available: true,
    next_available_at: now.toISOString()
  };
}

export function computeReferralGrants(sandwichPerRefAction: number, coffeePerRef2Action: number, hasLevel1: boolean, hasLevel2: boolean) {
  return {
    level1Sandwiches: hasLevel1 ? sandwichPerRefAction : 0,
    level2Coffee: hasLevel2 ? coffeePerRef2Action : 0
  };
}
