import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { TrainingTier } from '@/utils/onboarding';

export const TIER_BADGES: Record<TrainingTier, { image: number; aspectRatio: number }> = {
  Spawn: { image: require('@/assets/images/Badge_Spawn.png'), aspectRatio: 1238 / 1213 },
  Tadpole: { image: require('@/assets/images/Badge_Tadpole.png'), aspectRatio: 1 },
  Froglet: { image: require('@/assets/images/Badge_Froglet.png'), aspectRatio: 1 },
  Bullfrog: { image: require('@/assets/images/Badge_Bullfrog.png'), aspectRatio: 1 },
  Goliath: { image: require('@/assets/images/Badge_Goliath.png'), aspectRatio: 1 },
  'Mythic Battletoad': {
    image: require('@/assets/images/Badge_Battletoad.png'),
    aspectRatio: 1166 / 1096,
  },
};

interface TierBadgeProps {
  tier: TrainingTier;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const badge = TIER_BADGES[tier];

  return (
    <Image
      source={badge.image}
      contentFit="contain"
      accessibilityLabel={`${tier} tier badge`}
      style={[styles.badge, { aspectRatio: badge.aspectRatio }]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 144,
    alignSelf: 'center',
    marginBottom: 8,
  },
});
