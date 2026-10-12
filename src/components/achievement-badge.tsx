import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

interface AchievementBadgeProps {
  image: number;
  locked: boolean;
  // Hides the artwork entirely, for secret achievements that are still locked
  hidden?: boolean;
  size: number;
}

export function AchievementBadge({ image, locked, hidden = false, size }: AchievementBadgeProps) {
  if (hidden) {
    return (
      <View style={[styles.hidden, { width: size, height: size, borderRadius: size * 0.2 }]}>
        <Text style={[styles.question, { fontSize: size * 0.5 }]}>?</Text>
      </View>
    );
  }

  return (
    <Image
      source={image}
      contentFit="contain"
      style={[{ width: size, height: size }, locked && styles.locked]}
    />
  );
}

const styles = StyleSheet.create({
  locked: { opacity: 0.3 },
  hidden: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eceeea',
    borderWidth: 3,
    borderColor: '#c4cbc4',
  },
  question: { color: '#8a9a8a', fontWeight: '800' },
});
