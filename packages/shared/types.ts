export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type MissionType = 'join_channel' | 'manual_confirm';

export interface Reward {
  steps?: number;
  sandwiches?: number;
  coffee?: number;
}

export interface UserProfile {
  id: string;
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  country_code: string | null;
  referral_code: string;
  referrer_id: string | null;
  steps: number;
  sandwiches: number;
  coffee: number;
  premium_until: string | null;
  next_available_at: string;
  daily_free_count: number;
  daily_free_reset_date: string;
}

export interface ConfigValues {
  cooldown_ms: number;
  max_free_actions_per_day: number;
  steps_per_wake: number;
  sandwich_per_ref_action: number;
  coffee_per_ref2_action: number;
}

export interface WakeEligibility {
  available: boolean;
  reason?: 'cooldown' | 'daily_limit';
  next_available_at: string;
  remaining_free_actions: number;
  requires_premium: boolean;
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  payload: Record<string, Json>;
  reward: Reward;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  country_flag: string | null;
  steps: number;
  rank: number;
}
