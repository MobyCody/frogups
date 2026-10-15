import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { shareApp } from '@/utils/share-app';
import { colors } from '@/constants/colors';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onOptOut: () => void;
}

export function ShareModal({ visible, onClose, onOptOut }: ShareModalProps) {
  const share = async () => {
    onClose();
    await shareApp();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🐸🪷💦</Text>
          <Text style={styles.title}>Hop in with friends</Text>
          <Text style={styles.body}>
            Training is easier together. Invite a friend and get frogged side by side.
          </Text>
          <Pressable accessibilityRole="button" onPress={share} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Share Frogups</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Maybe later</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOptOut} style={styles.optOutButton}>
            <Text style={styles.optOutText}>Don’t ask me again</Text>
          </Pressable>
        </View>
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
  emoji: { fontSize: 40 },
  title: { marginTop: 12, fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  body: { marginTop: 8, fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  primaryButton: {
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  secondaryButton: { marginTop: 8, padding: 10 },
  secondaryText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  optOutButton: { padding: 8 },
  optOutText: { fontSize: 13, color: colors.textSubtle },
});
