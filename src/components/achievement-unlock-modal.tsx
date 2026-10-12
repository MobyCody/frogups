import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AchievementBadge } from '@/components/achievement-badge';
import type { AchievementDefinition } from '@/utils/achievements';
import { shareAchievement } from '@/utils/share-achievement';

export function AchievementUnlockModal({
  achievement,
  onConfirm,
}: {
  achievement: AchievementDefinition | null;
  onConfirm: (id: string) => void;
}) {
  return (
    <Modal visible={achievement !== null} transparent animationType="fade">
      <View style={styles.backdrop}>
        {achievement && (
          <View style={styles.card}>
            <Text style={styles.kicker}>Achievement unlocked!</Text>
            <AchievementBadge image={achievement.image} locked={false} size={180} />
            <Text style={styles.title}>{achievement.title}</Text>
            <Text style={styles.body}>{achievement.description}</Text>
            <Pressable accessibilityRole="button" onPress={() => shareAchievement(achievement)} style={styles.shareButton}>
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onConfirm(achievement.id)} style={styles.okButton}>
              <Text style={styles.okText}>Awesome!</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#4d7c4d',
    fontWeight: '700',
    marginBottom: 16,
  },
  title: { marginTop: 16, fontSize: 24, fontWeight: '800', color: '#1d2a1d', textAlign: 'center' },
  body: { marginTop: 8, fontSize: 16, color: '#4d7c4d', textAlign: 'center' },
  shareButton: {
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2d7a33',
    paddingVertical: 12,
  },
  shareText: { color: '#2d7a33', fontSize: 16, fontWeight: '800' },
  okButton: {
    marginTop: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#2d7a33',
    borderRadius: 14,
    paddingVertical: 14,
  },
  okText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
