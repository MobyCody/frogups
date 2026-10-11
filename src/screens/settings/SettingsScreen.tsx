import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useOnboarding } from '@/hooks/use-onboarding';
import { useTraining } from '@/hooks/use-training';
import { DAYS_PER_WEEK_OPTIONS } from '@/utils/workout';

export default function SettingsScreen() {
  const router = useRouter();
  const training = useTraining();
  const { resetAssessment } = useOnboarding();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const resetApp = async () => {
    setResetting(true);
    await training.resetTraining();
    await resetAssessment();
    setResetting(false);
    setConfirmingReset(false);
    router.dismissAll();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Training days per week</Text>
          <View style={styles.dayRow}>
            {DAYS_PER_WEEK_OPTIONS.map((days) => {
              const selected = days === training.daysPerWeek;

              return (
                <Pressable
                  key={days}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${days} days per week`}
                  onPress={() => training.setDaysPerWeek(days)}
                  style={[styles.dayPill, selected && styles.dayPillSelected]}
                >
                  <Text style={[styles.dayPillText, selected && styles.dayPillTextSelected]}>{days}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Reset</Text>
          <Text style={styles.body}>
            Deletes your assessment and all training progress. This can’t be undone.
          </Text>
          {confirmingReset ? (
            <View style={styles.confirmRow}>
              <Pressable
                accessibilityRole="button"
                disabled={resetting}
                onPress={() => setConfirmingReset(false)}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={resetting}
                onPress={resetApp}
                style={[styles.button, styles.dangerButton, resetting && styles.disabled]}
              >
                <Text style={styles.dangerText}>Yes, reset everything</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmingReset(true)}
              style={[styles.button, styles.dangerButton]}
            >
              <Text style={styles.dangerText}>Reset app</Text>
            </Pressable>
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f8f2' },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 32 },
  title: { fontSize: 30, fontWeight: '800', color: '#1d2a1d', marginBottom: 20 },
  card: {
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
  body: { fontSize: 16, lineHeight: 24, color: '#1d2a1d', marginBottom: 16 },
  dayRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dayPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce6cc',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dayPillSelected: { backgroundColor: '#2d7a33', borderColor: '#2d7a33' },
  dayPillText: { fontSize: 16, fontWeight: '700', color: '#2d7a33' },
  dayPillTextSelected: { color: '#fff' },
  confirmRow: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { borderWidth: 1, borderColor: '#cce6cc', backgroundColor: '#fff' },
  cancelText: { color: '#1d2a1d', fontSize: 16, fontWeight: '700' },
  dangerButton: { backgroundColor: '#b3261e' },
  dangerText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  backButton: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  backText: { color: '#2d7a33', fontSize: 16, fontWeight: '700' },
});
