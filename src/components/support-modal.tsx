import { Image } from 'expo-image';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { KOFI_ENABLED, KOFI_URL } from '@/utils/support';

export function SupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const openKofi = () => {
    Linking.openURL(KOFI_URL).catch((error: unknown) => console.error('Failed to open Ko-fi:', error));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Image
            source={require('@/assets/images/illustrations/kofi.png')}
            contentFit="contain"
            accessibilityLabel="A frog developer at a computer with a coffee"
            style={styles.image}
          />
          <Text style={styles.body}>
            Frogups is made by one frog. If it helps you hop, you can buy me a coffee.
          </Text>
          {KOFI_ENABLED ? (
            <Pressable accessibilityRole="button" onPress={openKofi} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Buy me a Ko-fi</Text>
            </Pressable>
          ) : (
            <Text style={styles.soon}>The support page is coming soon.</Text>
          )}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Maybe later</Text>
          </Pressable>
        </View>
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
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center' },
  image: { width: '100%', aspectRatio: 480 / 444 },
  body: { marginTop: 16, fontSize: 16, color: '#4d7c4d', textAlign: 'center' },
  soon: { marginTop: 16, fontSize: 14, color: '#8a9a8a', textAlign: 'center' },
  primaryButton: {
    marginTop: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#2d7a33',
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  closeButton: { marginTop: 8, padding: 10 },
  closeText: { fontSize: 15, fontWeight: '700', color: '#2d7a33' },
});
