import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { TierBadge } from '@/components/tier-badge';
import { useOnboarding } from '@/hooks/use-onboarding';
import { TRAINING_TIER_DETAILS } from '@/utils/onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    maxPushupsInput,
    setMaxPushupsInput,
    tier,
    isValid,
    status,
    error,
    submitAssessment,
  } = useOnboarding();

  useEffect(() => {
    if (status === 'saved') {
      router.replace('/home');
    }
  }, [router, status]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Initial Assessment</Text>
        <Text style={styles.title}>How many pushups can you do in one strict set?</Text>

        <TextInput
          value={maxPushupsInput}
          onChangeText={setMaxPushupsInput}
          keyboardType="number-pad"
          placeholder="e.g. 18"
          inputMode="numeric"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {tier ? (
          <View style={styles.tierCard}>
            <Text style={styles.tierLabel}>Starting tier</Text>
            <TierBadge tier={tier} />
            <Text style={styles.tier}>{tier}</Text>
            <Text style={styles.tierRange}>{TRAINING_TIER_DETAILS[tier].range}</Text>
            <Text style={styles.tierDescription}>
              {TRAINING_TIER_DETAILS[tier].description}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={submitAssessment}
          disabled={!isValid || status === 'loading'}
          style={[styles.button, (!isValid || status === 'loading') && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {status === 'saved' ? 'Assessment saved' : 'Save assessment'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8f2',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: 'center',
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
  input: {
    borderWidth: 1,
    borderColor: '#bfd7bf',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    fontSize: 20,
    color: '#1d2a1d',
    marginBottom: 16,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  tierCard: {
    backgroundColor: '#eaf7ea',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cce6cc',
  },
  tierLabel: {
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
  tierRange: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4d7c4d',
    marginTop: 4,
  },
  tierDescription: {
    fontSize: 14,
    color: '#1d2a1d',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#2d7a33',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});