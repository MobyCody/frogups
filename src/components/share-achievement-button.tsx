import { Image } from 'expo-image';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Pressable, type StyleProp, StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

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
            <Text style={styles.brand}>🐸🪷💦 Frogups</Text>
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
    backgroundColor: '#eaf7ea',
    padding: 28,
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#2d7a33',
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#4d7c4d',
    fontWeight: '700',
  },
  badge: { width: 220, height: 220, marginTop: 16 },
  title: { marginTop: 16, fontSize: 28, fontWeight: '800', color: '#1d2a1d', textAlign: 'center' },
  description: { marginTop: 8, fontSize: 16, color: '#4d7c4d', textAlign: 'center' },
  date: { marginTop: 8, fontSize: 13, color: '#6b8a6b' },
  footer: {
    marginTop: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#cce6cc',
  },
  catchphrase: { fontSize: 18, fontWeight: '800', color: '#2D7A33' },
  brand: { marginTop: 4, fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
});
