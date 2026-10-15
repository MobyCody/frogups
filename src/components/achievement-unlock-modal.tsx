import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AchievementBadge } from '@/components/achievement-badge';
import { ShareAchievementButton } from '@/components/share-achievement-button';
import type { AchievementDefinition } from '@/utils/achievements';
import { colors } from '@/constants/colors';

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
            <ShareAchievementButton
              achievement={achievement}
              style={styles.shareButton}
              textStyle={styles.shareText}
            />
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
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', backgroundColor: colors.white, borderRadius: 20, padding: 24, alignItems: 'center' },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 16,
  },
  title: { marginTop: 16, fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  body: { marginTop: 8, fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  shareButton: {
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 12,
  },
  shareText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  okButton: {
    marginTop: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  okText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
