import FontAwesome from '@expo/vector-icons/FontAwesome';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { Suspense, useEffect } from 'react';
import 'react-native-reanimated';

import { Text, useThemeColor } from '@/components/Themed';
import { initializeDb } from '@/db/client';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const textColor = useThemeColor({}, 'text')
  const tintColor = useThemeColor({}, 'tint')
  const backgroundColor = useThemeColor({}, 'background')
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Text>Loading...</Text>}>
        <SQLiteProvider databaseName="zero_budgeter.db" onInit={initializeDb} useSuspense>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modals/new-transaction" options={{
              presentation: 'modal',
              title: 'New Transaction',
              headerShown: true,
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: backgroundColor,
              },
              headerTintColor: tintColor,
              headerTitleStyle: {
                fontWeight: '600',
                color: textColor
              },
            }} />
            <Stack.Screen name="category/[id]" options={{
              presentation: 'modal',
              title: 'Envelope Details',
              headerShown: true,
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: backgroundColor,
              },
              headerTintColor: tintColor,
              headerTitleStyle: {
                fontWeight: '600',
                color: textColor,
              },
            }} />
            <Stack.Screen name="accounts/[id]" options={{
              presentation: 'modal',
              title: 'Account Details',
              headerShown: true,
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: backgroundColor,
              },
              headerTintColor: tintColor,
              headerTitleStyle: {
                fontWeight: '600',
                color: textColor,
              },
            }} />
          </Stack>
          <StatusBar style="auto" />
        </SQLiteProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
