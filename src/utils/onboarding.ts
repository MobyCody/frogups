export type TrainingTier =
  | 'Spawn'
  | 'Tadpole'
  | 'Froglet'
  | 'Bullfrog'
  | 'Goliath'
  | 'Mythic Battletoad';

export const TRAINING_TIER_DETAILS: Record<
  TrainingTier,
  { range: string; description: string }
> = {
  Spawn: {
    range: '0–5 pushups',
    description: 'Build basic strength and establish good form.',
  },
  Tadpole: {
    range: '6–14 pushups',
    description: 'Build endurance and confidence.',
  },
  Froglet: {
    range: '15–29 pushups',
    description: 'Build serious volume on a solid foundation.',
  },
  Bullfrog: {
    range: '30–49 pushups',
    description: 'Develop the strength for sustained, high-rep sets.',
  },
  Goliath: {
    range: '50–74 pushups',
    description: 'Reach elite stamina and muscle endurance.',
  },
  'Mythic Battletoad': {
    range: '75+ pushups',
    description: 'Build the conditioning for 200-pushup daily blocks.',
  },
};

export const TRAINING_TIERS: readonly TrainingTier[] = [
  'Spawn',
  'Tadpole',
  'Froglet',
  'Bullfrog',
  'Goliath',
  'Mythic Battletoad',
];

export const TIER_MIN_PUSHUPS: Record<TrainingTier, number> = {
  Spawn: 0,
  Tadpole: 6,
  Froglet: 15,
  Bullfrog: 30,
  Goliath: 50,
  'Mythic Battletoad': 75,
};

export interface TierProgress {
  tierIndex: number;
  // 0–1 position along the track from the first badge to the last
  progress: number;
  nextTier: TrainingTier | null;
  pushupsToNextTier: number;
}

export function getTierProgress(maxPushups: number): TierProgress {
  const tierIndex = TRAINING_TIERS.indexOf(getStartingTier(maxPushups));
  const nextTier = TRAINING_TIERS[tierIndex + 1] ?? null;

  if (!nextTier) {
    return { tierIndex, progress: 1, nextTier: null, pushupsToNextTier: 0 };
  }

  const tierMin = TIER_MIN_PUSHUPS[TRAINING_TIERS[tierIndex]];
  const nextMin = TIER_MIN_PUSHUPS[nextTier];
  const fraction = (maxPushups - tierMin) / (nextMin - tierMin);

  return {
    tierIndex,
    progress: (tierIndex + fraction) / (TRAINING_TIERS.length - 1),
    nextTier,
    pushupsToNextTier: nextMin - maxPushups,
  };
}

export function isValidMaxPushupInput(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function getStartingTier(maxPushups: number): TrainingTier {
  if (maxPushups <= 5) {
    return 'Spawn';
  }

  if (maxPushups <= 14) {
    return 'Tadpole';
  }

  if (maxPushups <= 29) {
    return 'Froglet';
  }

  if (maxPushups <= 49) {
    return 'Bullfrog';
  }

  if (maxPushups <= 74) {
    return 'Goliath';
  }

  return 'Mythic Battletoad';
}