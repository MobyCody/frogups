import { StyleSheet, Text, View } from 'react-native';

export const LOGO_FONT = 'Silkscreen_700Bold';

export function AppLogo() {
  return (
    <View accessibilityRole="header" accessibilityLabel="FrogUps" style={styles.row}>
      <Text style={[styles.text, styles.frog]}>FROG</Text>
      <Text style={[styles.text, styles.ups]}>UPS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: LOGO_FONT,
    fontSize: 28,
    letterSpacing: 2,
    textShadowColor: '#0f3d14',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  frog: {
    color: '#2D7A33',
  },
  ups: {
    color: '#1E3A8A',
  },
});
