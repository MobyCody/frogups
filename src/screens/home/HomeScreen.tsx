import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TierBadge } from '@/components/tier-badge';
import { TierProgressBar } from '@/components/tier-progress-bar';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTraining } from '@/hooks/use-training';
import { TRAINING_TIER_DETAILS } from '@/utils/onboarding';

const CATCHPHRASES = [
  'GET FROGGED!',
  'GET RIBBIT!',
  'TIME TO FROGOUT!',
  "GET HOPPIN'!",
  'BIGGEST AMPHIBIAN IN THE POND!',
  'DO YOU EVEN LEAP?',
  'TOADTALLY SHREDDED!',
];

export default function HomeScreen() {
  const router = useRouter();
  const [catchphrase] = useState(
    () => CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)],
  );
  const { assessment, status } = useOnboarding();
  const training = useTraining();

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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={12}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.cog}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.assessmentCard}>
          <Text style={styles.cardLabel}>Your tier</Text>
          <TierBadge tier={assessment.tier} />
          <Text style={styles.tier}>{assessment.tier}</Text>
          <Text style={styles.range}>{TRAINING_TIER_DETAILS[assessment.tier].range}</Text>
          <Text style={styles.description}>{TRAINING_TIER_DETAILS[assessment.tier].description}</Text>
          <Text style={styles.bestRecord}>
            Best: {assessment.maxPushups} {assessment.maxPushups === 1 ? 'pushup' : 'pushups'} to failure
          </Text>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Tier progression</Text>
          <TierProgressBar maxPushups={assessment.maxPushups} />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Training block</Text>
          <Text style={styles.description}>
            {training.nextSessionKind === 'test'
              ? 'Block complete. Your level-up test is next.'
              : `Workout ${training.completedInBlock + 1} of ${training.sessionsPerBlock} before your level-up test.`}
          </Text>
          <Text style={styles.subtle}>{training.daysPerWeek} training days per week</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  cog: {
    fontSize: 26,
    color: '#4d7c4d',
  },
  subtle: {
    fontSize: 14,
    color: '#4d7c4d',
    marginTop: 4,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8f2',
  },
  container: {
    flexGrow: 1,
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
