import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
    DEFAULT_DAYS_PER_WEEK,
    getNextSessionKind,
    getSessionsPerBlock,
    isValidDaysPerWeek,
    type SessionKind,
} from '@/utils/workout';

const STORAGE_KEY = 'frogups.training';
const MAX_HISTORY = 100;

export interface SessionRecord {
  kind: SessionKind;
  completedAt: string;
  // Reps per set; a test has a single entry
  reps: number[];
}

interface TrainingState {
  daysPerWeek: number;
  completedInBlock: number;
  history: SessionRecord[];
}

const INITIAL_STATE: TrainingState = {
  daysPerWeek: DEFAULT_DAYS_PER_WEEK,
  completedInBlock: 0,
  history: [],
};

export interface UseTrainingResult {
  status: 'loading' | 'ready' | 'error';
  daysPerWeek: number;
  completedInBlock: number;
  sessionsPerBlock: number;
  nextSessionKind: SessionKind;
  history: SessionRecord[];
  setDaysPerWeek: (days: number) => Promise<void>;
  completeSession: (kind: SessionKind, reps: number[]) => Promise<void>;
  resetTraining: () => Promise<void>;
}

function parseState(raw: string | null): TrainingState {
  if (!raw) {
    return INITIAL_STATE;
  }

  const saved = JSON.parse(raw) as Partial<TrainingState>;

  return {
    daysPerWeek: isValidDaysPerWeek(saved.daysPerWeek) ? saved.daysPerWeek : DEFAULT_DAYS_PER_WEEK,
    completedInBlock:
      Number.isSafeInteger(saved.completedInBlock) && (saved.completedInBlock as number) >= 0
        ? (saved.completedInBlock as number)
        : 0,
    history: Array.isArray(saved.history) ? saved.history : [],
  };
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
            setState(parseState(raw));
            setStatus('ready');
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

  const setDaysPerWeek = useCallback(
    async (days: number) => {
      if (!isValidDaysPerWeek(days)) {
        return;
      }

      await persist({ ...state, daysPerWeek: days });
    },
    [persist, state],
  );

  const completeSession = useCallback(
    async (kind: SessionKind, reps: number[]) => {
      const record: SessionRecord = { kind, completedAt: new Date().toISOString(), reps };

      await persist({
        ...state,
        completedInBlock: kind === 'test' ? 0 : state.completedInBlock + 1,
        history: [...state.history, record].slice(-MAX_HISTORY),
      });
    },
    [persist, state],
  );

  const resetTraining = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setState(INITIAL_STATE);
    } catch (resetError) {
      console.error('Failed to reset training state:', resetError);
      setStatus('error');
    }
  }, []);

  return {
    status,
    daysPerWeek: state.daysPerWeek,
    completedInBlock: state.completedInBlock,
    sessionsPerBlock: getSessionsPerBlock(state.daysPerWeek),
    nextSessionKind: getNextSessionKind(state.completedInBlock, state.daysPerWeek),
    history: state.history,
    setDaysPerWeek,
    completeSession,
    resetTraining,
  };
}
