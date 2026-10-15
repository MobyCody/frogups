import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '@/hooks/use-onboarding';
import { useTraining } from '@/hooks/use-training';
import { formatReminderTime, WEEKDAYS } from '@/utils/workout';
import { colors } from '@/constants/colors';

const MINUTE_STEP = 5;

function TimeStepper({
  label,
  value,
  onStep,
}: {
  label: string;
  value: string;
  onStep: (delta: 1 | -1) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        onPress={() => onStep(1)}
        style={styles.stepButton}
      >
        <Text style={styles.stepText}>▲</Text>
      </Pressable>
      <Text style={styles.timeValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        onPress={() => onStep(-1)}
        style={styles.stepButton}
      >
        <Text style={styles.stepText}>▼</Text>
      </Pressable>
    </View>
  );
}

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
          <Text style={styles.cardLabel}>Training days</Text>
          <View style={styles.dayRow}>
            {WEEKDAYS.map(({ index, short, long }) => {
              const selected = training.trainingDays.includes(index);

              return (
                <Pressable
                  key={index}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={long}
                  onPress={() => training.toggleTrainingDay(index)}
                  style={[styles.dayPill, selected && styles.dayPillSelected]}
                >
                  <Text style={[styles.dayPillText, selected && styles.dayPillTextSelected]}>{short}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Reminder time</Text>
          <View style={styles.timeRow}>
            <TimeStepper
              label="hour"
              value={String(training.reminderTime.hour).padStart(2, '0')}
              onStep={(delta) =>
                training.setReminderTime({
                  ...training.reminderTime,
                  hour: (training.reminderTime.hour + delta + 24) % 24,
                })
              }
            />
            <Text style={styles.timeColon}>:</Text>
            <TimeStepper
              label="minute"
              value={String(training.reminderTime.minute).padStart(2, '0')}
              onStep={(delta) =>
                training.setReminderTime({
                  ...training.reminderTime,
                  minute: (training.reminderTime.minute + delta * MINUTE_STEP + 60) % 60,
                })
              }
            />
          </View>
          <Text style={styles.subtle}>
            Remind me at {formatReminderTime(training.reminderTime)} on training days
          </Text>
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
  safeArea: { flex: 1, backgroundColor: colors.screenBackground },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 32 },
  title: { fontSize: 30, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
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
  body: { fontSize: 16, lineHeight: 24, color: colors.textPrimary, marginBottom: 16 },
  dayRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  dayPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  dayPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayPillText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  dayPillTextSelected: { color: colors.white },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 8 },
  timeColon: { fontSize: 36, fontWeight: '800', color: colors.textPrimary },
  stepper: { alignItems: 'center', gap: 4 },
  stepButton: {
    width: 64,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stepText: { fontSize: 16, color: colors.primary },
  timeValue: { fontSize: 36, fontWeight: '800', color: colors.textPrimary },
  subtle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  confirmRow: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  cancelText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  dangerButton: { backgroundColor: colors.danger },
  dangerText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  backButton: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
