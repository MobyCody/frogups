import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { TIER_BADGES } from '@/components/tier-badge';
import { getTierProgress, TRAINING_TIERS } from '@/utils/onboarding';

const BADGE_SIZE = 44;
const TRACK_HEIGHT = 8;

interface TierProgressBarProps {
  maxPushups: number;
}

export function TierProgressBar({ maxPushups }: TierProgressBarProps) {
  const { tierIndex, progress, nextTier, pushupsToNextTier } = getTierProgress(maxPushups);

  return (
    <View>
      <View style={styles.barContainer}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.badgeRow}>
          {TRAINING_TIERS.map((tier, index) => {
            const badge = TIER_BADGES[tier];
            const isCurrent = index === tierIndex;
            const isReached = index <= tierIndex;

            return (
              <View
                key={tier}
                style={[styles.badgeWrapper, isCurrent && styles.badgeWrapperCurrent]}
              >
                <Image
                  source={badge.image}
                  contentFit="contain"
                  accessibilityLabel={`${tier} badge${isReached ? '' : ' (locked)'}`}
                  style={[styles.badge, !isReached && styles.badgeLocked]}
                />
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.caption}>
        {nextTier
          ? `${pushupsToNextTier} more ${pushupsToNextTier === 1 ? 'pushup' : 'pushups'} in one set to reach ${nextTier}`
          : 'You’ve reached the final tier. Mythic!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    height: BADGE_SIZE + 8,
    justifyContent: 'center',
  },
  // Spans the centers of the first and last badge
  track: {
    position: 'absolute',
    left: BADGE_SIZE / 2,
    right: BADGE_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#cfe3fb',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: TRACK_HEIGHT / 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeWrapper: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#eaf2fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapperCurrent: {
    transform: [{ scale: 1.2 }],
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  badge: {
    width: BADGE_SIZE - 4,
    height: BADGE_SIZE - 4,
  },
  badgeLocked: {
    opacity: 0.35,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1d2a1d',
    marginTop: 12,
  },
});
