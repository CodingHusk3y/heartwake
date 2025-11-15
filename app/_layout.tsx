import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from "expo-router";
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NightBackground from '../components/NightBackground';
import { SessionProvider } from '../context/SessionContext';
import { initializeNotifications } from '../services/notifications';

export default function RootLayout() {
  useEffect(() => { initializeNotifications(); }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        {/* Background */}
        <NightBackground />
        {/* App navigation */}
        <ThemeProvider value={theme}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#0b1026' },
              headerTintColor: '#fff',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="alarm/edit" options={{ headerShown: true, title: 'Edit Alarm' }} />
            <Stack.Screen name="sleep/live" options={{ headerShown: true, title: 'Current Alarms' }} />
            <Stack.Screen name="sleep/setup" options={{ headerShown: true, title: 'Add Alarm' }} />
            <Stack.Screen name="sleep/history" options={{ headerShown: true, title: 'History' }} />
            <Stack.Screen name="sleep/rate" options={{ headerShown: true, title: 'Rate Wake' }} />
          </Stack>
        </ThemeProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: '#0b1026',
    text: '#ffffff',
    border: '#1a1f3a',
    primary: '#4a90e2',
  },
} as const;
