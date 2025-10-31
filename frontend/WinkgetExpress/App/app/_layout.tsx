import React, { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

function CaptainNavigationHandler() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Handle empty segments on initial load
    if (segments.length === 0) {
      if (!isAuthenticated) {
        router.replace('/(app)/(auth)');
      } else {
        router.replace('/(app)/(tabs)/home');
      }
      return;
    }

    const inAuth = segments[0] === '(app)' && segments[1] === '(auth)';
    const inTabs = segments[0] === '(app)' && segments[1] === '(tabs)';

    if (hasNavigated.current) return;

    if (!isAuthenticated) {
      if (!inAuth) {
        hasNavigated.current = true;
        router.replace('/(app)/(auth)');
      }
    } else {
      if (!inTabs && !inAuth) {
        hasNavigated.current = true;
        router.replace('/(app)/(tabs)/home');
      }
    }
  }, [loading, isAuthenticated, segments, router]);

  useEffect(() => {
    hasNavigated.current = false;
  }, [isAuthenticated]);

  if (loading) return <Loading />;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CaptainNavigationHandler />
        <StatusBar style="dark" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
