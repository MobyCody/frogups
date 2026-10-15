import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import { TierBadge } from '@/components/tier-badge';
import { useOnboarding } from '@/hooks/use-onboarding';
import { TRAINING_TIER_DETAILS } from '@/utils/onboarding';
import { colors } from '@/constants/colors';

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

  const submitted = useRef(false);

  // A saved assessment on launch goes straight home; a fresh one continues to schedule setup
  useEffect(() => {
    if (status !== 'saved') {
      return;
    }

    router.replace('/home');

    if (submitted.current) {
      submitted.current = false;
      router.push('/settings');
    }
  }, [router, status]);

  const handleSubmit = () => {
    submitted.current = true;
    submitAssessment();
  };

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
          onPress={handleSubmit}
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
    backgroundColor: colors.screenBackground,
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
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  tierCard: {
    backgroundColor: colors.surfaceTint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierLabel: {
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
  tierRange: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 4,
  },
  tierDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});