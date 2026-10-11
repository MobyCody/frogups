import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { View } from 'react-native';

export default function RootLayout() {
  const handleLayout = useCallback(() => {
    SplashScreen.hideAsync().catch((error: unknown) => {
      console.error('Failed to hide the native splash screen:', error);
    });
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}