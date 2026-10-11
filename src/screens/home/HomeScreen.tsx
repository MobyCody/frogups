import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { TierBadge } from '@/components/tier-badge';
import { TierProgressBar } from '@/components/tier-progress-bar';
import { useOnboarding } from '@/hooks/use-onboarding';
import { TRAINING_TIER_DETAILS } from '@/utils/onboarding';

export default function HomeScreen() {
  const router = useRouter();
  const { assessment, status } = useOnboarding();

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
        <Text style={styles.kicker}>FrogUps</Text>
        <Text style={styles.title}>GET FROGGED!</Text>

        <View style={styles.assessmentCard}>
          <Text style={styles.cardLabel}>Your starting tier</Text>
          <TierBadge tier={assessment.tier} />
          <Text style={styles.tier}>{assessment.tier}</Text>
          <Text style={styles.range}>{TRAINING_TIER_DETAILS[assessment.tier].range}</Text>
          <Text style={styles.description}>{TRAINING_TIER_DETAILS[assessment.tier].description}</Text>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Tier progression</Text>
          <TierProgressBar maxPushups={assessment.maxPushups} />
        </View>

        <Text style={styles.description}>
          Your assessment: {assessment.maxPushups} strict{' '}
          {assessment.maxPushups === 1 ? 'pushup' : 'pushups'} in one set.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8f2',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#4d7c4d',
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1d2a1d',
    marginBottom: 24,
  },
  assessmentCard: {
    backgroundColor: '#eaf7ea',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#cce6cc',
    marginBottom: 20,
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
