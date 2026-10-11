import { Silkscreen_700Bold, useFonts } from '@expo-google-fonts/silkscreen';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { View } from 'react-native';

import { AppLogo } from '@/components/app-logo';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Silkscreen_700Bold });

  const handleLayout = useCallback(() => {
    SplashScreen.hideAsync().catch((error: unknown) => {
      console.error('Failed to hide the native splash screen:', error);
    });
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      {(fontsLoaded || fontError) && (
        <Stack
          screenOptions={{
            headerTitle: () => <AppLogo />,
            headerTitleAlign: 'center',
            headerBackVisible: false,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#f5f8f2' },
          }}
        />
      )}
    </View>
  );
}