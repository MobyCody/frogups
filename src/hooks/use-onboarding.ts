import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import {
    getStartingTier,
    isValidMaxPushupInput,
    TRAINING_TIER_DETAILS,
    type TrainingTier,
} from '@/utils/onboarding';

const STORAGE_KEY = 'frogups.onboarding';

export interface OnboardingAssessment {
  maxPushups: number;
  tier: TrainingTier;
  completedAt: string;
}

export interface UseOnboardingResult {
  maxPushupsInput: string;
  setMaxPushupsInput: (value: string) => void;
  tier: TrainingTier | null;
  isValid: boolean;
  status: 'idle' | 'loading' | 'saved' | 'error';
  error: string | null;
  assessment: OnboardingAssessment | null;
  submitAssessment: () => Promise<void>;
  resetAssessment: () => Promise<void>;
  recordMaxPushups: (value: number) => Promise<OnboardingAssessment | null>;
}

export function useOnboarding(): UseOnboardingResult {
  const [maxPushupsInput, setMaxPushupsInput] = useState('');
  const [assessment, setAssessment] = useState<OnboardingAssessment | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saved' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const parsedValue = Number(maxPushupsInput);
  const isValid = maxPushupsInput.trim().length > 0 && isValidMaxPushupInput(parsedValue);

  const tier = useMemo<TrainingTier | null>(() => {
    if (!isValid) {
      return null;
    }

    return getStartingTier(parsedValue);
  }, [isValid, parsedValue]);

  // Reload on focus so a test result recorded on another screen shows up here
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadAssessment = async () => {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);

          if (!active) {
            return;
          }

          if (!raw) {
            setAssessment(null);
            setMaxPushupsInput('');
            setStatus('idle');
            return;
          }

          const saved: OnboardingAssessment = JSON.parse(raw);
          const updated: OnboardingAssessment = {
            ...saved,
            tier: getStartingTier(saved.maxPushups),
          };

          setAssessment(updated);
          setMaxPushupsInput(String(saved.maxPushups));
          setStatus('saved');
        } catch (loadError) {
          console.error('Failed to load onboarding assessment:', loadError);
          if (active) {
            setStatus('error');
            setError('Unable to restore your saved assessment.');
          }
        }
      };

      loadAssessment();

      return () => {
        active = false;
      };
    }, []),
  );

  const recordMaxPushups = useCallback(
    async (value: number): Promise<OnboardingAssessment | null> => {
      if (!assessment || !isValidMaxPushupInput(value)) {
        return null;
      }

      const maxPushups = Math.max(assessment.maxPushups, value);
      const next: OnboardingAssessment = {
        ...assessment,
        maxPushups,
        tier: getStartingTier(maxPushups),
      };

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setAssessment(next);
        setMaxPushupsInput(String(maxPushups));
        return next;
      } catch (saveError) {
        console.error('Failed to record max pushups:', saveError);
        return null;
      }
    },
    [assessment],
  );

  const submitAssessment = useCallback(async () => {
    if (!isValid) {
      setStatus('error');
      setError('Please enter a whole-number pushup count of 0 or more.');
      return;
    }

    const nextAssessment: OnboardingAssessment = {
      maxPushups: parsedValue,
      tier: getStartingTier(parsedValue),
      completedAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextAssessment));
      setAssessment(nextAssessment);
      setStatus('saved');
      setError(null);
    } catch (saveError) {
      console.error('Failed to save onboarding assessment:', saveError);
      setStatus('error');
      setError('Your assessment could not be saved offline.');
    }
  }, [isValid, parsedValue]);

  const resetAssessment = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setAssessment(null);
      setMaxPushupsInput('');
      setStatus('idle');
      setError(null);
    } catch (resetError) {
      console.error('Failed to reset onboarding assessment:', resetError);
      setStatus('error');
      setError('Unable to reset the assessment.');
    }
  }, []);

  return {
    maxPushupsInput,
    setMaxPushupsInput,
    tier,
    isValid,
    status,
    error,
    assessment,
    submitAssessment,
    resetAssessment,
    recordMaxPushups,
  };
}