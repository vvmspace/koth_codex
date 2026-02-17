import type { WakeEligibility } from '../types';

export function getWakeEligibility(params: { now: Date; nextAvailableAt: Date }): WakeEligibility {
  const { now, nextAvailableAt } = params;
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
