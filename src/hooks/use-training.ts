import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { cancelReminders, type ReminderSettings, syncReminders } from '@/utils/reminders';
import {
    type AchievementDefinition,
    type AchievementSnapshot,
    getAchievement,
    getEarnedAchievements,
} from '@/utils/achievements';
import type { TrainingTier } from '@/utils/onboarding';
import {
    dayKey,
    DEFAULT_REMINDER_TIME,
    DEFAULT_TRAINING_DAYS,
    getNextSessionKind,
    getSessionsPerBlock,
    getStreak,
    getTrainingDaysFromCount,
    MOSS_PER_FREEZE,
    normalizeReminderTime,
    normalizeTrainingDays,
    type ReminderTime,
    type SessionKind,
    settleFreezes,
} from '@/utils/workout';

const STORAGE_KEY = 'frogups.training';
const MAX_HISTORY = 100;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export interface SessionRecord {
  kind: SessionKind;
  completedAt: string;
  // Reps per set; a test has a single entry
  reps: number[];
}

interface TrainingState {
  // 0 = Monday … 6 = Sunday, sorted, never empty
  trainingDays: number[];
  reminderTime: ReminderTime;
  completedInBlock: number;
  history: SessionRecord[];
  moss: number;
  // Banked freezes, spent automatically on a missed training day
  freezes: number;
  frozenDays: string[];
  settledThrough: string | null;
  // Achievement id -> ISO unlock time
  unlocked: Record<string, string>;
  // Unlocked achievements the user has already confirmed in the pop-up
  acknowledged: string[];
  lifetimeTotalReps: number;
  lifetimeRestDaysVisited: number;
  lifetimeOffScheduleWorkouts: number;
  lifetimeTotalMoss: number;
  freezeUsedThisBlock: boolean;
  lastRestVisitDay: string | null;
}

const INITIAL_STATE: TrainingState = {
  trainingDays: DEFAULT_TRAINING_DAYS,
  reminderTime: DEFAULT_REMINDER_TIME,
  completedInBlock: 0,
  history: [],
  moss: 0,
  freezes: 0,
  frozenDays: [],
  settledThrough: null,
  unlocked: {},
  acknowledged: [],
  lifetimeTotalReps: 0,
  lifetimeRestDaysVisited: 0,
  lifetimeOffScheduleWorkouts: 0,
  lifetimeTotalMoss: 0,
  freezeUsedThisBlock: false,
  lastRestVisitDay: null,
}
export interface UseTrainingResult {
  status: 'loading' | 'ready' | 'error';
  trainingDays: number[];
  reminderTime: ReminderTime;
  setReminderTime: (time: ReminderTime) => Promise<void>;
  daysPerWeek: number;
  completedInBlock: number;
  sessionsPerBlock: number;
  nextSessionKind: SessionKind;
  history: SessionRecord[];
  streak: number;
  doneToday: boolean;
  moss: number;
  freezes: number;
  canMoisturize: boolean;
  moisturize: () => Promise<void>;
  unlocked: Record<string, string>;
  // Oldest unlocked achievement the user hasn't confirmed yet
  pendingAchievement: AchievementDefinition | null;
  acknowledgeAchievement: (id: string) => Promise<void>;
  recordRestVisit: () => Promise<void>;
  toggleTrainingDay: (day: number) => Promise<void>;
  completeSession: (kind: SessionKind, reps: number[], tier: TrainingTier) => Promise<void>;
  resetTraining: () => Promise<void>;
}

function toReminderSettings(state: TrainingState): ReminderSettings {
  return {
    trainingDays: state.trainingDays,
    reminderTime: state.reminderTime,
    completedAt: state.history.map((record) => record.completedAt),
    frozenDays: state.frozenDays,
  };
}

function toCount(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? (value as number) : 0;
}

function parseState(raw: string | null): TrainingState {
  if (!raw) {
    return INITIAL_STATE;
  }

  const saved = JSON.parse(raw) as Partial<TrainingState> & { daysPerWeek?: unknown };

  const history: SessionRecord[] = Array.isArray(saved.history) ? saved.history : [];
  const moss = toCount(saved.moss);

  return {
    trainingDays: normalizeTrainingDays(saved.trainingDays) ?? getTrainingDaysFromCount(saved.daysPerWeek),
    reminderTime: normalizeReminderTime(saved.reminderTime),
    completedInBlock: toCount(saved.completedInBlock),
    history,
    moss,
    freezes: toCount(saved.freezes),
    frozenDays: Array.isArray(saved.frozenDays)
      ? saved.frozenDays.filter((day): day is string => typeof day === 'string' && DATE_KEY.test(day))
      : [],
    settledThrough:
      typeof saved.settledThrough === 'string' && DATE_KEY.test(saved.settledThrough)
        ? saved.settledThrough
        : null,
    unlocked: parseUnlocked(saved.unlocked),
    acknowledged: Array.isArray(saved.acknowledged)
      ? saved.acknowledged.filter((id): id is string => typeof id === 'string')
      : [],
    // Existing users start from what their saved data already shows
    lifetimeTotalReps:
      saved.lifetimeTotalReps === undefined
        ? history.reduce((sum, record) => sum + record.reps.reduce((a, b) => a + b, 0), 0)
        : toCount(saved.lifetimeTotalReps),
    lifetimeRestDaysVisited: toCount(saved.lifetimeRestDaysVisited),
    lifetimeOffScheduleWorkouts: toCount(saved.lifetimeOffScheduleWorkouts),
    lifetimeTotalMoss:
      saved.lifetimeTotalMoss === undefined ? moss : toCount(saved.lifetimeTotalMoss),
    freezeUsedThisBlock: saved.freezeUsedThisBlock === true,
    lastRestVisitDay:
      typeof saved.lastRestVisitDay === 'string' && DATE_KEY.test(saved.lastRestVisitDay)
        ? saved.lastRestVisitDay
        : null,
  };
}

function parseUnlocked(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [id, at] of Object.entries(value)) {
    if (getAchievement(id) && typeof at === 'string') {
      result[id] = at;
    }
  }

  return result;
}

type AchievementEvents = Partial<
  Pick<AchievementSnapshot, 'testJustCompleted' | 'blockWithoutFreeze' | 'freezeJustSpent'>
>;

// Adds any newly earned achievements; already unlocked ones keep their date
function unlockAchievements(
  state: TrainingState,
  tier: TrainingTier | null,
  events: AchievementEvents = {},
): TrainingState {
  const streak = getStreak(
    state.history.map((record) => record.completedAt),
    state.trainingDays,
    new Date(),
    state.frozenDays,
  ).current;

  const earned = getEarnedAchievements({
    tier,
    streak,
    freezes: state.freezes,
    lifetimeTotalReps: state.lifetimeTotalReps,
    lifetimeRestDaysVisited: state.lifetimeRestDaysVisited,
    lifetimeOffScheduleWorkouts: state.lifetimeOffScheduleWorkouts,
    lifetimeTotalMoss: state.lifetimeTotalMoss,
    totalSessions: state.history.length,
    testJustCompleted: false,
    blockWithoutFreeze: false,
    freezeJustSpent: false,
    ...events,
  }).filter((id) => !state.unlocked[id]);

  if (earned.length === 0) {
    return state;
  }

  const now = new Date().toISOString();

  return {
    ...state,
    unlocked: { ...state.unlocked, ...Object.fromEntries(earned.map((id) => [id, now])) },
  };
}

// Spends freezes on training days missed since the app was last opened
function settle(state: TrainingState): TrainingState {
  const settled = settleFreezes(
    state.history.map((record) => record.completedAt),
    state.trainingDays,
    state,
  );
  const spent = settled.freezes < state.freezes;
  const next = { ...state, ...settled, freezeUsedThisBlock: state.freezeUsedThisBlock || spent };

  return spent ? unlockAchievements(next, null, { freezeJustSpent: true }) : next;
}

export function useTraining(): UseTrainingResult {
  const [state, setState] = useState<TrainingState>(INITIAL_STATE);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Reload on focus so the home screen reflects a workout finished on another screen
  useFocusEffect(
    useCallback(() => {
      let active = true;

      AsyncStorage.getItem(STORAGE_KEY)
        .then((raw) => {
          if (active) {
            const parsed = parseState(raw);
            const loaded = settle(parsed);
            setState(loaded);
            setStatus('ready');

            if (loaded.settledThrough !== parsed.settledThrough || loaded.freezes !== parsed.freezes) {
              AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loaded)).catch((saveError) =>
                console.error('Failed to save settled freezes:', saveError),
              );
            }

            // Keep schedule in sync with saved settings without prompting for permission
            syncReminders(toReminderSettings(loaded), false);
          }
        })
        .catch((loadError) => {
          console.error('Failed to load training state:', loadError);
          if (active) {
            setStatus('error');
          }
        });

      return () => {
        active = false;
      };
    }, []),
  );

  const persist = useCallback(async (next: TrainingState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
    } catch (saveError) {
      console.error('Failed to save training state:', saveError);
      setStatus('error');
    }
  }, []);

  const toggleTrainingDay = useCallback(
    async (day: number) => {
      const isOn = state.trainingDays.includes(day);

      // At least one training day must stay on
      if (isOn && state.trainingDays.length === 1) {
        return;
      }

      const trainingDays = isOn
        ? state.trainingDays.filter((d) => d !== day)
        : [...state.trainingDays, day].sort((a, b) => a - b);

      await persist({ ...state, trainingDays });
      await syncReminders(toReminderSettings({ ...state, trainingDays }), true);
    },
    [persist, state],
  );

  const setReminderTime = useCallback(
    async (time: ReminderTime) => {
      const reminderTime = normalizeReminderTime(time);

      await persist({ ...state, reminderTime });
      await syncReminders(toReminderSettings({ ...state, reminderTime }), true);
    },
    [persist, state],
  );

  const completeSession = useCallback(
    async (kind: SessionKind, reps: number[], tier: TrainingTier) => {
      const completedAt = new Date();
      const record: SessionRecord = { kind, completedAt: completedAt.toISOString(), reps };
      const isTest = kind === 'test';

      const updated: TrainingState = {
        ...state,
        completedInBlock: isTest ? 0 : state.completedInBlock + 1,
        history: [...state.history, record].slice(-MAX_HISTORY),
        moss: state.moss + 1,
        lifetimeTotalMoss: state.lifetimeTotalMoss + 1,
        lifetimeTotalReps: state.lifetimeTotalReps + reps.reduce((sum, rep) => sum + rep, 0),
        lifetimeOffScheduleWorkouts:
          state.lifetimeOffScheduleWorkouts +
          (completedAt.getHours() === state.reminderTime.hour ? 0 : 1),
        // A new block starts after each test
        freezeUsedThisBlock: isTest ? false : state.freezeUsedThisBlock,
      };
      const next = unlockAchievements(updated, tier, {
        testJustCompleted: isTest,
        blockWithoutFreeze: isTest && !state.freezeUsedThisBlock,
      });

      await persist(next);
      // Re-sync so today's streak alert is dropped now that the session is done
      await syncReminders(toReminderSettings(next), false);
    },
    [persist, state],
  );

  const moisturize = useCallback(async () => {
    if (state.moss < MOSS_PER_FREEZE) {
      return;
    }

    await persist(
      unlockAchievements(
        { ...state, moss: state.moss - MOSS_PER_FREEZE, freezes: state.freezes + 1 },
        null,
      ),
    );
  }, [persist, state]);

  const acknowledgeAchievement = useCallback(
    async (id: string) => {
      if (state.acknowledged.includes(id)) {
        return;
      }

      await persist({ ...state, acknowledged: [...state.acknowledged, id] });
    },
    [persist, state],
  );

  // Counts a visit to the rest screen on a scheduled rest day, once per day
  const recordRestVisit = useCallback(async () => {
    const today = dayKey(new Date());

    if (state.lastRestVisitDay === today) {
      return;
    }

    await persist(
      unlockAchievements(
        {
          ...state,
          lastRestVisitDay: today,
          lifetimeRestDaysVisited: state.lifetimeRestDaysVisited + 1,
        },
        null,
      ),
    );
  }, [persist, state]);

  const resetTraining = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await cancelReminders();
      setState(INITIAL_STATE);
    } catch (resetError) {
      console.error('Failed to reset training state:', resetError);
      setStatus('error');
    }
  }, []);

  const pendingId = Object.entries(state.unlocked)
    .filter(([id]) => !state.acknowledged.includes(id))
    .sort(([, a], [, b]) => a.localeCompare(b))[0]?.[0];
  const pendingAchievement = pendingId ? (getAchievement(pendingId) ?? null) : null;

  const streakInfo = getStreak(
    state.history.map((record) => record.completedAt),
    state.trainingDays,
    new Date(),
    state.frozenDays,
  );

  return {
    status,
    moss: state.moss,
    freezes: state.freezes,
    canMoisturize: state.moss >= MOSS_PER_FREEZE,
    moisturize,
    unlocked: state.unlocked,
    pendingAchievement,
    acknowledgeAchievement,
    recordRestVisit,
    streak: streakInfo.current,
    doneToday: streakInfo.doneToday,
    trainingDays: state.trainingDays,
    reminderTime: state.reminderTime,
    setReminderTime,
    daysPerWeek: state.trainingDays.length,
    completedInBlock: state.completedInBlock,
    sessionsPerBlock: getSessionsPerBlock(),
    nextSessionKind: getNextSessionKind(state.completedInBlock),
    history: state.history,
    toggleTrainingDay,
    completeSession,
    resetTraining,
  };
}
