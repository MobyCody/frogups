import { Share } from 'react-native';

import type { AchievementDefinition } from '@/utils/achievements';

export function shareAchievement(achievement: AchievementDefinition): void {
  Share.share({
    message: `I just unlocked "${achievement.title}" in Frogups! ${achievement.description} 🐸`,
  }).catch((error: unknown) => console.error('Failed to share achievement:', error));
}
