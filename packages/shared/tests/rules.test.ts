import { describe, expect, it } from 'vitest';
import { computeReferralGrants, getWakeEligibility } from '../domain/rules';

describe('domain rules', () => {
  it('blocks wake by cooldown', () => {
    const res = getWakeEligibility({
      now: new Date('2025-01-01T00:00:00Z'),
      lastAwake: new Date('2025-01-01T00:30:00Z'),
      wakeIntervalMs: 60 * 60 * 1000
    });
    expect(res.available).toBe(false);
    expect(res.reason).toBe('cooldown');
  });

  it('allows wake after cooldown', () => {
    const res = getWakeEligibility({
      now: new Date('2025-01-01T02:00:00Z'),
      lastAwake: new Date('2025-01-01T00:30:00Z'),
      wakeIntervalMs: 60 * 60 * 1000
    });
    expect(res.available).toBe(true);
  });

  it('allows wake when no last_awake', () => {
    const res = getWakeEligibility({
      now: new Date('2025-01-01T00:00:00Z'),
      lastAwake: null,
      wakeIntervalMs: 60 * 60 * 1000
    });
    expect(res.available).toBe(true);
  });

  it('computes referral grants for level1 and level2', () => {
    const grants = computeReferralGrants(1, 1, true, true);
    expect(grants).toEqual({ level1Sandwiches: 1, level2Coffee: 1 });
  });
});
