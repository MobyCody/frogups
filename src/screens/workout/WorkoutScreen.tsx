import { Image } from 'expo-image';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementUnlockModal } from '@/components/achievement-unlock-modal';
import { TierBadge } from '@/components/tier-badge';
import { colors } from '@/constants/colors';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTraining } from '@/hooks/use-training';
import { useTrainingPlan } from '@/hooks/use-training-plan';
import { isValidMaxPushupInput } from '@/utils/onboarding';
import { evaluateTest, REST_SECONDS, type SessionKind } from '@/utils/workout';

type Phase = 'intro' | 'set' | 'rest' | 'finished';

export default function WorkoutScreen() {
  const router = useRouter();
  const { assessment, status, recordMaxPushups } = useOnboarding();
  const training = useTraining();
  const plan = useTrainingPlan(assessment?.maxPushups ?? 0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [kind, setKind] = useState<SessionKind>('workout');
  const [setIndex, setSetIndex] = useState(0);
  const [completedReps, setCompletedReps] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(REST_SECONDS);
  const [failureInput, setFailureInput] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const restVisitRecorded = useRef(false);
  const { status: trainingStatus, trainingDays, doneToday, recordRestVisit } = training;

  // Visiting the rest screen on a scheduled rest day counts toward an achievement
  useEffect(() => {
    const isRestDay = !trainingDays.includes((new Date().getDay() + 6) % 7);

    if (trainingStatus !== 'ready' || phase !== 'intro' || doneToday || !isRestDay || restVisitRecorded.current) {
      return;
    }

    restVisitRecorded.current = true;
    recordRestVisit();
  }, [trainingStatus, phase, doneToday, trainingDays, recordRestVisit]);
  // Keep the screen on while a session is in progress
  const sessionActive = phase === 'set' || phase === 'rest';

  useEffect(() => {
    if (!sessionActive) {
      return;
    }

    const tag = 'workout-session';
    activateKeepAwakeAsync(tag).catch((keepAwakeError) =>
      console.error('Failed to keep screen awake:', keepAwakeError),
    );

    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [sessionActive]);

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
        <ActivityIndicator accessibilityLabel="Loading your workout" color={colors.primary} />
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

  // Block overtraining: one session per day, and only on selected training days.
  // Not shown after finishing, so the result screen still appears.
  const isTrainingDay = training.trainingDays.includes((new Date().getDay() + 6) % 7);

  if ((training.doneToday || !isTrainingDay) && phase === 'intro') {
    return (
      <View style={styles.restScreen}>
        <Image
          source={require('@/assets/images/illustrations/chilling-frog.jpg')}
          contentFit="cover"
          accessibilityLabel="A frog chilling"
          style={styles.restImage}
        />
        <SafeAreaView style={styles.restBottom}>
          <Text style={styles.title}>Time to rest</Text>
          <Text style={styles.body}>
            Rest is where the strength is built. Take it easy today and come back on your next training day.
          </Text>
          <PrimaryButton label="Back home" onPress={() => router.dismissTo('/home')} />
        </SafeAreaView>
        <AchievementUnlockModal
          achievement={training.pendingAchievement}
          onConfirm={training.acknowledgeAchievement}
        />
      </View>
    );
  }

  const workoutDays = plan.filter((day) => day.sets.length > 0);
  const todaysWorkout = workoutDays[training.completedInBlock % Math.max(workoutDays.length, 1)];
  const plannedReps = todaysWorkout?.sets.map((set) => set.targetReps) ?? [];
  const isTest = kind === 'test';
  const totalSets = isTest ? 1 : plannedReps.length;
  const isFailureSet = isTest;
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

    let tier = assessment.tier;

    if (isTest) {
      const outcome = evaluateTest(assessment.maxPushups, reps[0], assessment.tier);
      tier = outcome.tier;
      await recordMaxPushups(reps[0]);
      setResultMessage(
        outcome.leveledUp
          ? `Level up! You are now a ${outcome.tier} with a max of ${outcome.maxPushups}.`
          : `${reps[0]} pushups. Keep training to reach the next tier.`,
      );
    }

    await training.completeSession(kind, reps, tier);
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

    if (setIndex >= totalSets - 1) {
      finishSession([...completedReps, plannedReps[setIndex]]);
      return;
    }

    setCompletedReps((reps) => [...reps, plannedReps[setIndex]]);
    setSecondsLeft(REST_SECONDS);
    setPhase('rest');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.stage}>
          <TierBadge tier={assessment.tier} />
          <SetList
            totalSets={phase === 'intro' ? (training.nextSessionKind === 'test' ? 1 : plannedReps.length) : totalSets}
            plannedReps={plannedReps}
            isTest={phase === 'intro' ? training.nextSessionKind === 'test' : isTest}
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
                  : `${plannedReps.reduce((a, b) => a + b, 0)} pushups in ${plannedReps.length} sets with ${REST_SECONDS}s rest in between.`}
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
            <Text style={styles.title}>{isFailureSet ? 'To failure!' : `${plannedReps[setIndex]} pushups`}</Text>
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
              <Text style={styles.total}>{completedReps.reduce((sum, reps) => sum + reps, 0)} total pushups</Text>
              <View style={styles.mossEarnedRow}>
                <Image source={require('@/assets/images/illustrations/moss.png')} style={styles.mossEarnedIcon} contentFit="contain" />
                <Text style={styles.mossEarned}>+1 moss earned!</Text>
              </View>
            </View>
            <View style={styles.buttonSlot}>
              <PrimaryButton label="Back home" onPress={() => router.dismissTo('/home')} />
            </View>
          </>
        )}
        </View>
      </View>
      <AchievementUnlockModal
        achievement={training.pendingAchievement}
        onConfirm={training.acknowledgeAchievement}
      />
    </SafeAreaView>
  );
}

function SetList({
  totalSets,
  plannedReps,
  isTest,
  completedReps,
  activeIndex,
}: {
  totalSets: number;
  plannedReps: number[];
  isTest: boolean;
  completedReps: number[];
  activeIndex: number;
}) {
  return (
    <View style={styles.setRow} accessibilityLabel={`${totalSets} sets`}>
      {Array.from({ length: totalSets }, (_, index) => {
        const isActive = index === activeIndex;
        const isDone = completedReps[index] !== undefined;
        const isFailure = isTest;
        const label = isDone ? String(completedReps[index]) : isFailure ? 'MAX' : String(plannedReps[index]);

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
  mossEarnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  mossEarnedIcon: { height: 32, aspectRatio: 384 / 247 },
  mossEarned: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  safeArea: { flex: 1, backgroundColor: colors.screenBackground },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  restScreen: { flex: 1, backgroundColor: colors.screenBackground },
  // Cover-fit crops the left and right edges to fill the top two thirds, edge to edge
  restImage: { width: '100%', height: '66%' },
  restBottom: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  title: { fontSize: 30, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
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
  total: { fontSize: 30, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: 8 },
  timer: { fontSize: 72, fontWeight: '800', color: colors.primary, marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, color: colors.textPrimary, marginBottom: 24, textAlign: 'center' },
  input: {
    alignSelf: 'stretch',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  setValue: { fontSize: 22, fontWeight: '500', color: colors.textSubtle },
  setValueDone: { color: colors.textSoft },
  setValueActive: { fontSize: 32, fontWeight: '800', color: colors.primary },
});
