import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Linking, Pressable, type StyleProp, StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { colors } from '@/constants/colors';
import type { AchievementDefinition } from '@/utils/achievements';
import { shareAchievement } from '@/utils/share-achievement';

interface ShareAchievementButtonProps {
  achievement: AchievementDefinition;
  unlockedAt?: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
}

// Renders the card off-screen and shares it as an image, falling back to plain text
export function ShareAchievementButton({ achievement, unlockedAt, style, textStyle }: ShareAchievementButtonProps) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    if (sharing) {
      return;
    }

    setSharing(true);

    try {
      if (!cardRef.current || !(await Sharing.isAvailableAsync())) {
        shareAchievement(achievement);
        return;
      }

      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });

      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your achievement' });
    } catch (error) {
      console.error('Failed to share achievement card:', error);
      shareAchievement(achievement);
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <View ref={cardRef} collapsable={false} style={styles.offscreen} pointerEvents="none">
        <View style={styles.card}>
          <Text style={styles.kicker}>Achievement unlocked</Text>
          <Image source={achievement.image} contentFit="contain" style={styles.badge} />
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
          <Text style={styles.date}>{new Date(unlockedAt ?? Date.now()).toLocaleDateString()}</Text>
          <View style={styles.footer}>
            <Text style={styles.catchphrase}>GET FROGGED WITH ME!</Text>
            <Text 
              style={styles.brand} 
              onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.frogups.frogups')}>
                Download Frogups 🐸🪷💦
            </Text>
          </View>
        </View>
      </View>
      <Pressable accessibilityRole="button" disabled={sharing} onPress={share} style={[style, sharing && styles.busy]}>
        <Text style={textStyle}>Share</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  busy: { opacity: 0.6 },
  card: {
    width: 360,
    backgroundColor: colors.surfaceTint,
    padding: 28,
    alignItems: 'center',
    borderWidth: 6,
    borderColor: colors.primary,
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontWeight: '700',
  },
  badge: { width: 220, height: 220, marginTop: 16 },
  title: { marginTop: 16, fontSize: 28, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  description: { marginTop: 8, fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  date: { marginTop: 8, fontSize: 13, color: colors.textSoft },
  footer: {
    marginTop: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  catchphrase: { fontSize: 18, fontWeight: '800', color: colors.primary },
  brand: { marginTop: 4, fontSize: 15, fontWeight: '700', color: colors.navy },
});
