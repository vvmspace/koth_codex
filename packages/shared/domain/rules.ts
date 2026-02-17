import type { ConfigValues, WakeEligibility } from '../types';

export function resetDailyCountIfNeeded(dailyResetDate: string, dailyCount: number, now: Date): { dailyCount: number; dailyResetDate: string } {
  const today = now.toISOString().slice(0, 10);
  if (dailyResetDate !== today) {
    return { dailyCount: 0, dailyResetDate: today };
  }
  return { dailyCount, dailyResetDate };
}

export function getWakeEligibility(params: {
  now: Date;
  nextAvailableAt: Date;
  dailyFreeCount: number;
  config: ConfigValues;
  isPremium: boolean;
}): WakeEligibility {
  const { now, nextAvailableAt, dailyFreeCount, config, isPremium } = params;
  const remaining = Math.max(config.max_free_actions_per_day - dailyFreeCount, 0);
  if (now < nextAvailableAt) {
    return {
      available: false,
      reason: 'cooldown',
      next_available_at: nextAvailableAt.toISOString(),
      remaining_free_actions: remaining,
      requires_premium: false
    };
  }
  if (remaining <= 0 && !isPremium) {
    return {
      available: false,
      reason: 'daily_limit',
      next_available_at: now.toISOString(),
      remaining_free_actions: 0,
      requires_premium: true
    };
  }
  return {
    available: true,
    next_available_at: now.toISOString(),
    remaining_free_actions: remaining,
    requires_premium: false
  };
}

export function computeReferralGrants(sandwichPerRefAction: number, coffeePerRef2Action: number, hasLevel1: boolean, hasLevel2: boolean) {
  return {
    level1Sandwiches: hasLevel1 ? sandwichPerRefAction : 0,
    level2Coffee: hasLevel2 ? coffeePerRef2Action : 0
  };
}
