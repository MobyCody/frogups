import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TierBadge } from '@/components/tier-badge';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTraining } from '@/hooks/use-training';
import { isValidMaxPushupInput } from '@/utils/onboarding';
import {
  evaluateTest,
  FIXED_SET_REPS,
  REST_SECONDS,
  SETS_PER_WORKOUT,
  type SessionKind,
} from '@/utils/workout';

type Phase = 'intro' | 'set' | 'rest' | 'finished';

export default function WorkoutScreen() {
  const router = useRouter();
  const { assessment, status, recordMaxPushups } = useOnboarding();
  const training = useTraining();

  const [phase, setPhase] = useState<Phase>('intro');
  const [kind, setKind] = useState<SessionKind>('workout');
  const [setIndex, setSetIndex] = useState(0);
  const [completedReps, setCompletedReps] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(REST_SECONDS);
  const [failureInput, setFailureInput] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (phase !== 'rest') {
      return;
    }

    if (secondsLeft <= 0) {
      setSetIndex((index) => index + 1);
      setPhase('set');
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);

    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  if (status === 'loading' || training.status === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator accessibilityLabel="Loading your workout" color="#2d7a33" />
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>No assessment yet</Text>
          <PrimaryButton label="Take the assessment" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const fixedReps = FIXED_SET_REPS[assessment.tier];
  const isTest = kind === 'test';
  const totalSets = isTest ? 1 : SETS_PER_WORKOUT;
  const isFailureSet = isTest || setIndex === SETS_PER_WORKOUT - 1;
  const failureReps = Number(failureInput);
  const failureInputValid = failureInput.trim().length > 0 && isValidMaxPushupInput(failureReps);

  const startSession = () => {
    setKind(training.nextSessionKind);
    setSetIndex(0);
    setCompletedReps([]);
    setFailureInput('');
    setPhase('set');
  };

  const finishSession = async (reps: number[]) => {
    setSaving(true);

    if (isTest) {
      const outcome = evaluateTest(assessment.maxPushups, reps[0], assessment.tier);
      await recordMaxPushups(reps[0]);
      setResultMessage(
        outcome.leveledUp
          ? `Level up! You are now a ${outcome.tier} with a max of ${outcome.maxPushups}.`
          : `${reps[0]} pushups. Keep training to reach the next tier.`,
      );
    } else {
      setResultMessage(`Workout complete: ${reps.join(' + ')} pushups.`);
    }

    await training.completeSession(kind, reps);
    setCompletedReps(reps);
    setSaving(false);
    setPhase('finished');
  };

  const completeSet = () => {
    if (isFailureSet) {
      if (!failureInputValid) {
        return;
      }

      finishSession([...completedReps, failureReps]);
      return;
    }

    setCompletedReps((reps) => [...reps, fixedReps]);
    setSecondsLeft(REST_SECONDS);
    setPhase('rest');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.stage}>
          <TierBadge tier={assessment.tier} />
          <SetList
            totalSets={phase === 'intro' ? (training.nextSessionKind === 'test' ? 1 : SETS_PER_WORKOUT) : totalSets}
            fixedReps={fixedReps}
            completedReps={completedReps}
            activeIndex={phase === 'set' ? setIndex : phase === 'rest' ? setIndex + 1 : -1}
          />

        {phase === 'intro' && (
          <>
            <View style={styles.stageContent}>
              <Text style={styles.kicker}>{assessment.tier}</Text>
              <Text style={styles.title}>
                {training.nextSessionKind === 'test' ? 'Level-up test' : 'Today’s workout'}
              </Text>
              <Text style={styles.body}>
                {training.nextSessionKind === 'test'
                  ? 'One set to failure. Beat the next tier’s minimum to level up.'
                  : `${SETS_PER_WORKOUT - 1} sets of ${fixedReps} with ${REST_SECONDS}s rest, then a final set to failure.`}
              </Text>
            </View>
            <View style={styles.buttonSlot}>
              <PrimaryButton label="Start" onPress={startSession} />
              <View style={styles.belowSlot}>
                <SecondaryButton label="Back" onPress={() => router.back()} />
              </View>
            </View>
          </>
        )}

        {phase === 'set' && (
          <>
            <View style={styles.stageContent}>
            <Text style={styles.kicker}>
              Set {setIndex + 1} of {totalSets}
            </Text>
            <Text style={styles.title}>{isFailureSet ? 'To failure!' : `${fixedReps} pushups`}</Text>
            {isFailureSet ? (
              <>
                <Text style={styles.body}>Do as many strict pushups as you can, then enter your count.</Text>
                <TextInput
                  accessibilityLabel="Pushups completed"
                  keyboardType="number-pad"
                  placeholder="Reps completed"
                  value={failureInput}
                  onChangeText={setFailureInput}
                  style={styles.input}
                />
              </>
            ) : (
              <Text style={styles.body}>Complete the set, then tap done to start your rest.</Text>
            )}
            </View>
            <View style={styles.buttonSlot}>
              <PrimaryButton
                label={isFailureSet ? 'Finish' : 'Set done'}
                disabled={(isFailureSet && !failureInputValid) || saving}
                onPress={completeSet}
              />
            </View>
          </>
        )}

        {phase === 'rest' && (
          <>
            <View style={styles.stageContent}>
              <Text style={styles.kicker}>Rest</Text>
              <Text style={styles.timer}>{secondsLeft}s</Text>
              <Text style={styles.body}>
                Next: set {setIndex + 2} of {totalSets}
              </Text>
            </View>
            <View style={styles.buttonSlot}>
              <SecondaryButton
                label="Skip rest"
                onPress={() => {
                  setSetIndex((index) => index + 1);
                  setPhase('set');
                }}
              />
            </View>
          </>
        )}

        {phase === 'finished' && (
          <>
            <View style={styles.stageContent}>
              <Text style={styles.title}>Nicely done!</Text>
              <Text style={styles.body}>{resultMessage}</Text>
              <Text style={styles.total}>{completedReps.reduce((sum, reps) => sum + reps, 0)} total</Text>
            </View>
            <View style={styles.buttonSlot}>
              <PrimaryButton label="Back home" onPress={() => router.dismissTo('/home')} />
            </View>
          </>
        )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function SetList({
  totalSets,
  fixedReps,
  completedReps,
  activeIndex,
}: {
  totalSets: number;
  fixedReps: number;
  completedReps: number[];
  activeIndex: number;
}) {
  return (
    <View style={styles.setRow} accessibilityLabel={`${totalSets} sets`}>
      {Array.from({ length: totalSets }, (_, index) => {
        const isActive = index === activeIndex;
        const isDone = completedReps[index] !== undefined;
        const isFailure = index === totalSets - 1;
        const label = isDone ? String(completedReps[index]) : isFailure ? 'MAX' : String(fixedReps);

        return (
          <Text
            key={index}
            accessibilityLabel={`Set ${index + 1}: ${label}${isActive ? ', current' : ''}`}
            style={[styles.setValue, isDone && styles.setValueDone, isActive && styles.setValueActive]}
          >
            {label}
          </Text>
        );
      })}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f8f2' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#4d7c4d',
    fontWeight: '700',
    marginBottom: 12,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#1d2a1d', marginBottom: 12, textAlign: 'center' },
  stage: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageContent: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  buttonSlot: { width: '100%', height: 64, justifyContent: 'center' },
  belowSlot: { position: 'absolute', top: '100%', left: 0, right: 0 },
  total: { fontSize: 30, fontWeight: '700', color: '#2d7a33', textAlign: 'center', marginBottom: 8 },
  timer: { fontSize: 72, fontWeight: '800', color: '#2d7a33', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, color: '#1d2a1d', marginBottom: 24, textAlign: 'center' },
  input: {
    alignSelf: 'stretch',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#cce6cc',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2d7a33',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#2d7a33', fontSize: 16, fontWeight: '700' },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  setValue: { fontSize: 22, fontWeight: '500', color: '#9aae9a' },
  setValueDone: { color: '#6b8f6b' },
  setValueActive: { fontSize: 32, fontWeight: '800', color: '#2d7a33' },
});
