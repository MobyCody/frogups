import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { TrainingTier } from '@/utils/onboarding';

export const TIER_BADGES: Record<TrainingTier, { image: number; aspectRatio: number }> = {
  Spawn: { image: require('@/assets/images/tiers/spawn.png'), aspectRatio: 1238 / 1213 },
  Tadpole: { image: require('@/assets/images/tiers/tadpole.png'), aspectRatio: 1 },
  Froglet: { image: require('@/assets/images/tiers/froglet.png'), aspectRatio: 1 },
  Bullfrog: { image: require('@/assets/images/tiers/bullfrog.png'), aspectRatio: 1 },
  Goliath: { image: require('@/assets/images/tiers/goliath.png'), aspectRatio: 1 },
  'Mythic Battletoad': {
    image: require('@/assets/images/tiers/battletoad.png'),
    aspectRatio: 1166 / 1096,
  },
};

interface TierBadgeProps {
  tier: TrainingTier;
  height?: number;
}

export function TierBadge({ tier, height = 144 }: TierBadgeProps) {
  const badge = TIER_BADGES[tier];

  return (
    <Image
      source={badge.image}
      contentFit="contain"
      accessibilityLabel={`${tier} tier badge`}
      style={[styles.badge, { height, aspectRatio: badge.aspectRatio }]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    marginBottom: 8,
  },
});
