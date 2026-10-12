import { useMemo } from 'react';

export interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  // The final set is performed as many reps as possible
  isAmrap: boolean;
}

export interface Workout {
  day: number;
  isRestDay: boolean;
  isRecalibrationTest: boolean;
  sets: WorkoutSet[];
}

export const PLAN_LENGTH_DAYS = 14;
export const SET_PERCENTAGES = [0.45, 0.55, 0.4, 0.4, 0.5] as const;
export const PROGRESSION_FACTOR = 1.05;

const TRAINING_DAYS: ReadonlySet<number> = new Set([1, 3, 5, 7, 9, 11, 13]);

export function generateTrainingPlan(initialMax: number): Workout[] {
  if (!Number.isFinite(initialMax) || initialMax <= 0) {
    return [];
  }

  let activeDayIndex = 0;

  return Array.from({ length: PLAN_LENGTH_DAYS }, (_, index): Workout => {
    const day = index + 1;
    const isRecalibrationTest = day === PLAN_LENGTH_DAYS;

    if (!TRAINING_DAYS.has(day)) {
      return { day, isRestDay: !isRecalibrationTest, isRecalibrationTest, sets: [] };
    }

    // Compounds once per active day: 1.00, 1.05, 1.1025, …
    const multiplier = PROGRESSION_FACTOR ** activeDayIndex;
    activeDayIndex += 1;

    return {
      day,
      isRestDay: false,
      isRecalibrationTest: false,
      sets: SET_PERCENTAGES.map((percentage, setIndex) => ({
        setNumber: setIndex + 1,
        targetReps: Math.max(1, Math.round(initialMax * percentage * multiplier)),
        isAmrap: setIndex === SET_PERCENTAGES.length - 1,
      })),
    };
  });
}

export function useTrainingPlan(initialMax: number): Workout[] {
  return useMemo(() => generateTrainingPlan(initialMax), [initialMax]);
}
