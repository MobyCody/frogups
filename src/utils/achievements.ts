import { TRAINING_TIERS, type TrainingTier } from '@/utils/onboarding';

export type AchievementId =
  | 'spawn-point'
  | 'cult-of-the-bullfrog'
  | 'raid-boss'
  | 'swamp-paladin'
  | 'hoarder'
  | 'cryosleep'
  | 'drought-resistant'
  | 'over-encumbered'
  | 'tactical-retreat'
  | 'covert-ops'
  | 'masters-treatise'
  | 'frogged';

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  // Secret achievements hide their title and description until unlocked
  secret: boolean;
  image: number;
}

export const SWAMP_PALADIN_STREAK = 30;
export const HOARDER_FREEZES = 5;
export const OVER_ENCUMBERED_REPS = 1000;
export const TACTICAL_RETREAT_VISITS = 5;
export const COVERT_OPS_WORKOUTS = 10;
export const MASTERS_TREATISE_MOSS = 50;
export const FROGGED_SESSIONS = 50;

const MAX_TIER = TRAINING_TIERS[TRAINING_TIERS.length - 1];

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'spawn-point',
    title: 'The Spawn Point',
    description: 'Complete your first workout.',
    secret: false,
    image: require('@/assets/images/achievements/spawn-point.png'),
  },
  {
    id: 'cult-of-the-bullfrog',
    title: 'Cult of the Bullfrog',
    description: 'Graduate to the Bullfrog tier.',
    secret: false,
    image: require('@/assets/images/achievements/cult-of-the-bullfrog.png'),
  },
  {
    id: 'raid-boss',
    title: 'Raid Boss',
    description: `Reach the maximum tier: ${MAX_TIER}.`,
    secret: false,
    image: require('@/assets/images/achievements/raid-boss.png'),
  },
  {
    id: 'swamp-paladin',
    title: 'Swamp Paladin',
    description: `Keep an unbroken streak for ${SWAMP_PALADIN_STREAK} days.`,
    secret: false,
    image: require('@/assets/images/achievements/swamp-paladin.png'),
  },
  {
    id: 'hoarder',
    title: 'Hoarder',
    description: `Hold ${HOARDER_FREEZES} unspent banked freezes at one time.`,
    secret: false,
    image: require('@/assets/images/achievements/hoarder.png'),
  },
  {
    id: 'cryosleep',
    title: 'Cryosleep',
    description: 'Let a banked freeze save your streak after a missed day.',
    secret: false,
    image: require('@/assets/images/achievements/cryosleep.png'),
  },
  {
    id: 'drought-resistant',
    title: 'Drought Resistant',
    description: 'Complete a full training block without using a single freeze.',
    secret: false,
    image: require('@/assets/images/achievements/drought-resistant.png'),
  },
  {
    id: 'over-encumbered',
    title: 'Over-Encumbered',
    description: `Perform ${OVER_ENCUMBERED_REPS.toLocaleString('en-US')} lifetime pushups.`,
    secret: false,
    image: require('@/assets/images/achievements/over-encumbered.png'),
  },
  {
    id: 'tactical-retreat',
    title: 'Tactical Retreat',
    description: `Visit the Chilling Frog on a scheduled rest day ${TACTICAL_RETREAT_VISITS} times.`,
    secret: true,
    image: require('@/assets/images/achievements/tactical-retreat.png'),
  },
  {
    id: 'covert-ops',
    title: 'Covert Ops',
    description: `Complete ${COVERT_OPS_WORKOUTS} workouts outside of your scheduled reminder hour.`,
    secret: true,
    image: require('@/assets/images/achievements/covert-ops.png'),
  },
  {
    id: 'masters-treatise',
    title: 'Master’s Treatise',
    description: `Accumulate ${MASTERS_TREATISE_MOSS} total moss over the lifetime of the app.`,
    secret: false,
    image: require('@/assets/images/achievements/masters-treatise.png'),
  },
  {
    id: 'frogged',
    title: 'Frogged',
    description: `Finish ${FROGGED_SESSIONS} training sessions.`,
    secret: false,
    image: require('@/assets/images/achievements/frogged.png'),
  },
];

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}

export interface AchievementSnapshot {
  tier: TrainingTier | null;
  streak: number;
  freezes: number;
  lifetimeTotalReps: number;
  lifetimeRestDaysVisited: number;
  lifetimeOffScheduleWorkouts: number;
  lifetimeTotalMoss: number;
  totalSessions: number;
  // One-off events, true only for the call that follows them
  testJustCompleted: boolean;
  blockWithoutFreeze: boolean;
  freezeJustSpent: boolean;
}

export const EMPTY_SNAPSHOT: AchievementSnapshot = {
  tier: null,
  streak: 0,
  freezes: 0,
  lifetimeTotalReps: 0,
  lifetimeRestDaysVisited: 0,
  lifetimeOffScheduleWorkouts: 0,
  lifetimeTotalMoss: 0,
  totalSessions: 0,
  testJustCompleted: false,
  blockWithoutFreeze: false,
  freezeJustSpent: false,
};

function tierIndex(tier: TrainingTier | null): number {
  return tier ? TRAINING_TIERS.indexOf(tier) : -1;
}

// Every achievement whose condition holds for this snapshot
export function getEarnedAchievements(snapshot: AchievementSnapshot): AchievementId[] {
  const earned: AchievementId[] = [];

  if (snapshot.totalSessions >= 1) earned.push('spawn-point');
  if (tierIndex(snapshot.tier) >= TRAINING_TIERS.indexOf('Bullfrog')) earned.push('cult-of-the-bullfrog');
  if (snapshot.tier === MAX_TIER) earned.push('raid-boss');
  if (snapshot.streak >= SWAMP_PALADIN_STREAK) earned.push('swamp-paladin');
  if (snapshot.freezes >= HOARDER_FREEZES) earned.push('hoarder');
  if (snapshot.freezeJustSpent) earned.push('cryosleep');
  if (snapshot.testJustCompleted && snapshot.blockWithoutFreeze) earned.push('drought-resistant');
  if (snapshot.lifetimeTotalReps >= OVER_ENCUMBERED_REPS) earned.push('over-encumbered');
  if (snapshot.lifetimeRestDaysVisited >= TACTICAL_RETREAT_VISITS) earned.push('tactical-retreat');
  if (snapshot.lifetimeOffScheduleWorkouts >= COVERT_OPS_WORKOUTS) earned.push('covert-ops');
  if (snapshot.lifetimeTotalMoss >= MASTERS_TREATISE_MOSS) earned.push('masters-treatise');
  if (snapshot.totalSessions >= FROGGED_SESSIONS) earned.push('frogged');

  return earned;
}
