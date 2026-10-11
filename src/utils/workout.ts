import { getStartingTier, type TrainingTier } from '@/utils/onboarding';

export const DAYS_PER_WEEK_OPTIONS = [2, 3, 4, 5] as const;
export const DEFAULT_DAYS_PER_WEEK = 3;
export const SETS_PER_WORKOUT = 5;
export const REST_SECONDS = 60;
export const BLOCK_WEEKS = 2;

// Reps for sets 1–4; the final set is always to failure
export const FIXED_SET_REPS: Record<TrainingTier, number> = {
  Spawn: 2,
  Tadpole: 5,
  Froglet: 10,
  Bullfrog: 20,
  Goliath: 35,
  'Mythic Battletoad': 50,
};

export type SessionKind = 'workout' | 'test';

export function isValidDaysPerWeek(value: unknown): value is number {
  return DAYS_PER_WEEK_OPTIONS.some((option) => option === value);
}

export function getSessionsPerBlock(daysPerWeek: number): number {
  return daysPerWeek * BLOCK_WEEKS;
}

// Once a block's workouts are done, the next session is a single to-failure test
export function getNextSessionKind(completedInBlock: number, daysPerWeek: number): SessionKind {
  return completedInBlock >= getSessionsPerBlock(daysPerWeek) ? 'test' : 'workout';
}

export interface TestOutcome {
  maxPushups: number;
  tier: TrainingTier;
  leveledUp: boolean;
}

// A test never lowers the user's max or tier
export function evaluateTest(
  currentMax: number,
  reps: number,
  currentTier: TrainingTier,
): TestOutcome {
  const maxPushups = Math.max(currentMax, reps);
  const tier = getStartingTier(maxPushups);

  return { maxPushups, tier, leveledUp: tier !== currentTier };
}
