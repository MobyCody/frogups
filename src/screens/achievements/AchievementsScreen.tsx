import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementBadge } from '@/components/achievement-badge';
import { useTraining } from '@/hooks/use-training';
import { ACHIEVEMENTS, type AchievementDefinition } from '@/utils/achievements';
import { shareAchievement } from '@/utils/share-achievement';

export default function AchievementsScreen() {
  const router = useRouter();
  const training = useTraining();
  const [selected, setSelected] = useState<AchievementDefinition | null>(null);

  if (training.status === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator accessibilityLabel="Loading achievements" color="#2d7a33" />
      </SafeAreaView>
    );
  }

  const unlockedCount = ACHIEVEMENTS.filter((achievement) => training.unlocked[achievement.id]).length;

  const share = shareAchievement;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtle}>
          {unlockedCount} of {ACHIEVEMENTS.length} unlocked
        </Text>

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((achievement) => {
            const unlockedAt = training.unlocked[achievement.id];
            const hidden = achievement.secret && !unlockedAt;

            return (
              <Pressable
                key={achievement.id}
                accessibilityRole="button"
                accessibilityLabel={
                  hidden
                    ? 'Secret achievement, locked'
                    : `${achievement.title}, ${unlockedAt ? 'unlocked' : 'locked'}`
                }
                disabled={!unlockedAt}
                onPress={() => setSelected(achievement)}
                style={styles.tile}
              >
                <AchievementBadge image={achievement.image} hidden={hidden} locked={!unlockedAt} size={72} />
                <Text style={[styles.tileTitle, !unlockedAt && styles.locked]} numberOfLines={2}>
                  {hidden ? '???' : achievement.title}
                </Text>
                {!unlockedAt && (
                  <Text style={styles.tileHint} numberOfLines={3}>
                    {hidden ? 'Secret achievement' : achievement.description}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          {selected && (
            <View style={styles.card}>
              <AchievementBadge image={selected.image} locked={false} size={200} />
              <Text style={styles.cardTitle}>{selected.title}</Text>
              <Text style={styles.cardBody}>{selected.description}</Text>
              {training.unlocked[selected.id] && (
                <Text style={styles.cardDate}>
                  Unlocked {new Date(training.unlocked[selected.id]).toLocaleDateString()}
                </Text>
              )}
              <Pressable accessibilityRole="button" onPress={() => share(selected)} style={styles.shareButton}>
                <Text style={styles.shareText}>Share</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f8f2' },
  container: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#1d2a1d' },
  subtle: { fontSize: 14, color: '#4d7c4d', marginTop: 4, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cce6cc',
    padding: 14,
  },
  tileTitle: { marginTop: 8, fontSize: 15, fontWeight: '800', color: '#1d2a1d', textAlign: 'center' },
  tileHint: { marginTop: 4, fontSize: 12, color: '#4d7c4d', textAlign: 'center' },
  locked: { color: '#8a9a8a' },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf7ea',
    borderWidth: 3,
    borderColor: '#2d7a33',
  },
  badgeLocked: { backgroundColor: '#eceeea', borderColor: '#c4cbc4' },
  backButton: { marginTop: 20, alignItems: 'center', padding: 12 },
  backText: { fontSize: 16, fontWeight: '700', color: '#2d7a33' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  cardTitle: { marginTop: 16, fontSize: 24, fontWeight: '800', color: '#1d2a1d', textAlign: 'center' },
  cardBody: { marginTop: 8, fontSize: 16, color: '#4d7c4d', textAlign: 'center' },
  cardDate: { marginTop: 8, fontSize: 13, color: '#8a9a8a' },
  shareButton: {
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#2d7a33',
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  closeButton: { marginTop: 8, padding: 10 },
  closeText: { fontSize: 15, fontWeight: '700', color: '#2d7a33' },
});
