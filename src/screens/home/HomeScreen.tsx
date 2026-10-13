import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementUnlockModal } from '@/components/achievement-unlock-modal';
import { SupportModal } from '@/components/support-modal';
import { TierBadge } from '@/components/tier-badge';
import { TierProgressBar } from '@/components/tier-progress-bar';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTraining } from '@/hooks/use-training';
import { TRAINING_TIER_DETAILS } from '@/utils/onboarding';
import { MOSS_PER_FREEZE } from '@/utils/workout';

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

  useEffect(() => {
    if (status === 'idle') {
      router.replace('/');
    }
  }, [router, status]);

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator accessibilityLabel="Loading your assessment" color="#2d7a33" />
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Support the developer on Ko-fi"
            hitSlop={12}
            onPress={() => setSupportVisible(true)}
          >
            <Ionicons name="cafe-sharp" size={26} color="#4d7c4d" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Achievements"
            hitSlop={12}
            onPress={() => router.push('/achievements')}
          >
            <Ionicons name="trophy-sharp" size={26} color="#4d7c4d" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={12}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-sharp" size={26} color="#4d7c4d" />
          </Pressable>
        </View>

        <View style={styles.assessmentCard}>
          <Text style={styles.cardLabel}>Your tier</Text>
          <TierBadge tier={assessment.tier} height={96} />
          <Text style={styles.tier}>{assessment.tier}</Text>
          <Text style={styles.range}>{TRAINING_TIER_DETAILS[assessment.tier].range}</Text>
          <Text style={styles.bestRecord}>
            Best: {assessment.maxPushups} {assessment.maxPushups === 1 ? 'pushup' : 'pushups'} to failure
          </Text>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Tier progression</Text>
          <TierProgressBar maxPushups={assessment.maxPushups} />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Sweat to stay wet!</Text>
          <View style={styles.streakRow}>
            <Text style={[styles.splash, { fontSize: getSplashSize(training.streak) }]}>💦</Text>
            <Text style={styles.streak}>
              {training.streak} {training.streak === 1 ? 'day' : 'days'}
            </Text>
            <View style={styles.mossInfo}>
              <View style={styles.mossCountRow}>
                <Image source={require('@/assets/images/illustrations/moss.png')} style={styles.mossIcon} contentFit="contain" />
                <Text style={styles.mossCount}>{training.moss} moss</Text>
              </View>
              <Text style={styles.mossHint}>
                {training.freezes > 0
                  ? `💧 ${training.freezes} ${training.freezes === 1 ? 'freeze' : 'freezes'} banked`
                  : `spend ${MOSS_PER_FREEZE} to moisturize`}
              </Text>
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
          <Text style={styles.subtle}>
            {training.doneToday
              ? 'Good job staying clean.'
              : training.streak > 0
                ? 'Train today to keep it going.'
                : 'Finish a workout to get your feet wet.'}
          </Text>
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
        <AchievementUnlockModal
          achievement={training.pendingAchievement}
          onConfirm={training.acknowledgeAchievement}
        />
      </View>
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
    color: '#4d7c4d',
    marginTop: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: MAX_SPLASH_SIZE * 1.25,
  },
  splash: {
    includeFontPadding: false,
  },
  mossInfo: { flex: 1, alignItems: 'center', marginLeft: 60 },
  mossCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mossIcon: { height: 26, aspectRatio: 384 / 247 },
  mossCount: { fontSize: 16, fontWeight: '800', color: '#1d2a1d' },
  mossHint: { fontSize: 12, color: '#4d7c4d', marginTop: 2, marginBottom: 6 },
  moisturizeButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  moisturizeButtonDisabled: { opacity: 0.35 },
  moisturizeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  streak: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1d2a1d',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8f2',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#4d7c4d',
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1d2a1d',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#2d7a33',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  startButtonSubtext: {
    fontSize: 13,
    color: '#d9f0d9',
    marginTop: 4,
  },
  assessmentCard: {
    backgroundColor: '#eaf7ea',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#cce6cc',
    marginBottom: 12,
  },
  bestRecord: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d7a33',
    marginTop: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#cce6cc',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#4d7c4d',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tier: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1d2a1d',
  },
  range: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4d7c4d',
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1d2a1d',
    marginTop: 8,
  },
});
