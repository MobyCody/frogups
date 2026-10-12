import { getStartingTier, type TrainingTier } from '@/utils/onboarding';

// Index 0 = Monday … 6 = Sunday
export const WEEKDAYS = [
  { index: 0, short: 'Mon', long: 'Monday' },
  { index: 1, short: 'Tue', long: 'Tuesday' },
  { index: 2, short: 'Wed', long: 'Wednesday' },
  { index: 3, short: 'Thu', long: 'Thursday' },
  { index: 4, short: 'Fri', long: 'Friday' },
  { index: 5, short: 'Sat', long: 'Saturday' },
  { index: 6, short: 'Sun', long: 'Sunday' },
] as const;
export const DEFAULT_TRAINING_DAYS: number[] = [0, 2, 4];

// Spreads a legacy "days per week" count across the week
const LEGACY_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
};

export function getTrainingDaysFromCount(count: unknown): number[] {
  return typeof count === 'number' && LEGACY_DAYS[count] ? LEGACY_DAYS[count] : DEFAULT_TRAINING_DAYS;
}

export interface ReminderTime {
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER_TIME: ReminderTime = { hour: 18, minute: 0 };

export function normalizeReminderTime(value: unknown): ReminderTime {
  const { hour, minute } = (value ?? {}) as Partial<ReminderTime>;

  return Number.isInteger(hour) && (hour as number) >= 0 && (hour as number) <= 23 &&
    Number.isInteger(minute) && (minute as number) >= 0 && (minute as number) <= 59
    ? { hour: hour as number, minute: minute as number }
    : DEFAULT_REMINDER_TIME;
}

export function formatReminderTime({ hour, minute }: ReminderTime): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export interface StreakInfo {
  current: number;
  doneToday: boolean;
}

// Sortable local-date key (YYYY-MM-DD)
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const MOSS_PER_FREEZE = 5;
const MAX_FROZEN_DAYS = 60;

// Streak = consecutive scheduled training days with a session. Rest days never break it,
// a session on a rest day counts as a bonus, and today is forgiven until it's over.
// A frozen day (covered by a moisturize freeze) neither breaks nor adds to the streak.
export function getStreak(
  completedAtDates: string[],
  trainingDays: number[],
  now = new Date(),
  frozenDays: string[] = [],
): StreakInfo {
  const doneDays = new Set(completedAtDates.map((iso) => dayKey(new Date(iso))));
  const frozen = new Set(frozenDays);
  const doneToday = doneDays.has(dayKey(now));

  if (doneDays.size === 0) {
    return { current: 0, doneToday };
  }

  const earliest = Math.min(...completedAtDates.map((iso) => new Date(iso).getTime()));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let current = 0;

  while (cursor.getTime() >= earliest - 24 * 60 * 60 * 1000) {
    const key = dayKey(cursor);
    const isTrainingDay = trainingDays.includes((cursor.getDay() + 6) % 7);
    const isToday = key === dayKey(now);

    if (doneDays.has(key)) {
      current += 1;
    } else if (isTrainingDay && !isToday && !frozen.has(key)) {
      break;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, doneToday };
}

export interface FreezeState {
  freezes: number;
  frozenDays: string[];
  // Last day (YYYY-MM-DD) already checked for misses
  settledThrough: string | null;
}

// Spends a banked freeze on each training day missed since the last check, but only
// while there is a streak to protect. Days are settled once, so later freezes never apply retroactively.
export function settleFreezes(
  completedAt: string[],
  trainingDays: number[],
  state: FreezeState,
  now = new Date(),
): FreezeState {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = dayKey(yesterday);

  if (!state.settledThrough) {
    return { ...state, settledThrough: yesterdayKey };
  }

  if (state.settledThrough >= yesterdayKey) {
    return state;
  }

  if (state.freezes === 0) {
    return { ...state, settledThrough: yesterdayKey };
  }

  const [year, month, day] = state.settledThrough.split('-').map(Number);
  const cursor = new Date(year, month - 1, day + 1);
  const doneDays = new Set(completedAt.map((iso) => dayKey(new Date(iso))));
  const frozenDays = [...state.frozenDays];
  let freezes = state.freezes;

  while (dayKey(cursor) <= yesterdayKey && freezes > 0) {
    const key = dayKey(cursor);
    const isTrainingDay = trainingDays.includes((cursor.getDay() + 6) % 7);

    if (isTrainingDay && !doneDays.has(key)) {
      const dayBefore = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
      const before = getStreak(
        completedAt.filter((iso) => dayKey(new Date(iso)) < key),
        trainingDays,
        dayBefore,
        frozenDays,
      );

      if (before.current > 0) {
        freezes -= 1;
        frozenDays.push(key);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return { freezes, frozenDays: frozenDays.slice(-MAX_FROZEN_DAYS), settledThrough: yesterdayKey };
}

export function normalizeTrainingDays(value: unknown): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const days = Array.from(
    new Set(value.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6)),
  ).sort((a, b) => a - b);

  return days.length > 0 ? days : null;
}
export const REST_SECONDS = 60;

export type SessionKind = 'workout' | 'test';

// A block is the 7 training days of the 14-day plan, followed by the recalibration test
export const WORKOUTS_PER_BLOCK = 7;

export function getSessionsPerBlock(): number {
  return WORKOUTS_PER_BLOCK;
}

// Once a block's workouts are done, the next session is a single to-failure test
export function getNextSessionKind(completedInBlock: number): SessionKind {
  return completedInBlock >= WORKOUTS_PER_BLOCK ? 'test' : 'workout';
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
