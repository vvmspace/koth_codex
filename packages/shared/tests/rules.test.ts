import { describe, expect, it } from 'vitest';
import { computeReferralGrants, getWakeEligibility, resetDailyCountIfNeeded } from '../domain/rules';

describe('domain rules', () => {
  it('blocks wake by cooldown', () => {
    const res = getWakeEligibility({
      now: new Date('2025-01-01T00:00:00Z'),
      nextAvailableAt: new Date('2025-01-01T01:00:00Z'),
      dailyFreeCount: 0,
      config: {
        cooldown_ms: 28_800_000,
        max_free_actions_per_day: 3,
        steps_per_wake: 1,
        sandwich_per_ref_action: 1,
        coffee_per_ref2_action: 1
      },
      isPremium: false
    });
    expect(res.available).toBe(false);
    expect(res.reason).toBe('cooldown');
  });

  it('blocks after daily limit when not premium', () => {
    const res = getWakeEligibility({
      now: new Date('2025-01-01T02:00:00Z'),
      nextAvailableAt: new Date('2025-01-01T01:00:00Z'),
      dailyFreeCount: 3,
      config: {
        cooldown_ms: 28_800_000,
        max_free_actions_per_day: 3,
        steps_per_wake: 1,
        sandwich_per_ref_action: 1,
        coffee_per_ref2_action: 1
      },
      isPremium: false
    });
    expect(res.available).toBe(false);
    expect(res.reason).toBe('daily_limit');
  });

  it('resets daily counter when date changes', () => {
    const res = resetDailyCountIfNeeded('2025-01-01', 3, new Date('2025-01-02T00:01:00Z'));
    expect(res.dailyCount).toBe(0);
    expect(res.dailyResetDate).toBe('2025-01-02');
  });

  it('computes referral grants for level1 and level2', () => {
    const grants = computeReferralGrants(1, 1, true, true);
    expect(grants).toEqual({ level1Sandwiches: 1, level2Coffee: 1 });
  });
});
