import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-url-polyfill/auto';
import { AuthProvider } from '@/context/AuthContext';
import { useFrameworkReady } from '../hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />

        <Stack.Screen name="(captabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
