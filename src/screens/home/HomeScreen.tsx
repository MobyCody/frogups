import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementUnlockModal } from '@/components/achievement-unlock-modal';
import { ShareModal } from '@/components/share-modal';
import { SupportModal } from '@/components/support-modal';
import { TierBadge } from '@/components/tier-badge';
import { TierProgressBar } from '@/components/tier-progress-bar';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useSharePrompt } from '@/hooks/use-share-prompt';
import { useTraining } from '@/hooks/use-training';
import { TRAINING_TIER_DETAILS } from '@/utils/onboarding';
import { MOSS_PER_FREEZE } from '@/utils/workout';
import { colors } from '@/constants/colors';

const CATCHPHRASES = [
  'GET FROGGED!',
  'GET RIBBIT!',
  'TIME TO FROGOUT!',
  "GET HOPPIN'!",
  'BIGGEST AMPHIBIAN IN THE POND!',
  'DO YOU EVEN LEAP?',
  'TOADTALLY SHREDDED!',
];

const MIN_SPLASH_SIZE = 28;
const MAX_SPLASH_SIZE = 64;
const MAX_SPLASH_STREAK = 30;

// Grows linearly from 28 to 64 as the streak approaches 30 days, then stays maxed
function getSplashSize(streak: number): number {
  const ratio = Math.min(Math.max(streak, 0), MAX_SPLASH_STREAK) / MAX_SPLASH_STREAK;

  return Math.round(MIN_SPLASH_SIZE + ratio * (MAX_SPLASH_SIZE - MIN_SPLASH_SIZE));
}

export default function HomeScreen() {
  const router = useRouter();
  const [catchphrase] = useState(
    () => CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)],
  );
  const { assessment, status } = useOnboarding();
  const training = useTraining();

  const [supportVisible, setSupportVisible] = useState(false);
  const sharePrompt = useSharePrompt(
    training.history.length,
    training.status === 'ready',
    supportVisible || training.pendingAchievement !== null,
  );

  useEffect(() => {
    if (status === 'idle') {
      router.replace('/');
    }
  }, [router, status]);

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator accessibilityLabel="Loading your assessment" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>We couldn’t load your assessment</Text>
          <Text style={styles.description}>
            {status === 'error' ? 'Please try again from onboarding.' : 'Complete your assessment to get started.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Support the developer on Ko-fi"
            hitSlop={12}
            onPress={() => setSupportVisible(true)}
          >
            <Ionicons name="cafe-sharp" size={26} color={colors.textMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Achievements"
            hitSlop={12}
            onPress={() => router.push('/achievements')}
          >
            <Ionicons name="trophy-sharp" size={26} color={colors.textMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={12}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-sharp" size={26} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.assessmentCard}>
          <Text style={styles.cardLabel}>Your tier</Text>
          <View style={styles.tierRow}>
            <TierBadge tier={assessment.tier} height={96} />
            <View style={styles.tierInfo}>
              <Text style={styles.tier}>{assessment.tier}</Text>
              <Text style={styles.range}>{TRAINING_TIER_DETAILS[assessment.tier].range}</Text>
              <Text style={styles.bestRecord}>
                Best: {assessment.maxPushups} {assessment.maxPushups === 1 ? 'pushup' : 'pushups'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Tier progression</Text>
          <TierProgressBar maxPushups={assessment.maxPushups} />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Sweat to stay wet!</Text>
          <View style={styles.streakRow}>
            <View style={styles.splashSlot}>
              <Text style={[styles.splash, { fontSize: getSplashSize(training.streak) }]}>💦</Text>
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streak}>
                {training.streak} {training.streak === 1 ? 'day' : 'days'}
              </Text>
              <Text style={styles.subtle}>
                {training.doneToday
                  ? 'Good job staying clean.'
                  : training.streak > 0
                    ? 'Train today to keep it going.'
                    : 'Finish a workout to get your feet wet.'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.mossRow}>
            <View style={styles.mossInfo}>
              <View style={styles.mossCountRow}>
                <Image source={require('@/assets/images/illustrations/moss.png')} style={styles.mossIcon} contentFit="contain" />
                <Text style={styles.mossCount}>{training.moss} moss</Text>
              </View>
              <Text style={styles.mossHint}>
                {training.freezes > 0
                  ? `💧 ${training.freezes} ${training.freezes === 1 ? 'freeze' : 'freezes'} banked`
                  : `Spend ${MOSS_PER_FREEZE} to moisturize`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Moisturize for ${MOSS_PER_FREEZE} moss`}
              accessibilityState={{ disabled: !training.canMoisturize }}
              disabled={!training.canMoisturize}
              onPress={training.moisturize}
              style={[styles.moisturizeButton, !training.canMoisturize && styles.moisturizeButtonDisabled]}
            >
              <Text style={styles.moisturizeText}>Moisturize</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${catchphrase} Start today's workout`}
          onPress={() => router.push('/workout')}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        >
          <Text style={styles.startButtonText}>{catchphrase}</Text>
          <Text style={styles.startButtonSubtext}>
            {training.nextSessionKind === 'test' ? 'Start your level-up test' : 'Start today’s workout'}
          </Text>
        </Pressable>
        <SupportModal visible={supportVisible} onClose={() => setSupportVisible(false)} />
        <ShareModal
          visible={sharePrompt.visible}
          onClose={sharePrompt.dismiss}
          onOptOut={sharePrompt.optOut}
        />
        <AchievementUnlockModal
          achievement={training.pendingAchievement}
          onConfirm={training.acknowledgeAchievement}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  subtle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Fixed-size slot so the text doesn't shift as the splash grows with the streak
  splashSlot: {
    width: MAX_SPLASH_SIZE * 1.1,
    height: MAX_SPLASH_SIZE * 1.25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInfo: { flex: 1 },
  splash: {
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceTint,
    marginVertical: 12,
  },
  mossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mossInfo: { flex: 1 },
  mossCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mossIcon: { height: 26, aspectRatio: 384 / 247 },
  mossCount: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  mossHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  moisturizeButton: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  moisturizeButtonDisabled: { opacity: 0.35 },
  moisturizeText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  streak: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 25,
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  startButtonSubtext: {
    fontSize: 13,
    color: colors.textOnPrimarySoft,
    marginTop: 4,
  },
  assessmentCard: {
    backgroundColor: colors.surfaceTint,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  tierInfo: { flexShrink: 1 },
  bestRecord: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  tier: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  range: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    marginTop: 8,
  },
});
