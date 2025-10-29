import React, { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Re-export useAuth for convenience
export { useAuth } from '../context/AuthContext';

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// Layout Component with Navigation Logic
function NavigationHandler() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('NavigationHandler: Auth state changed', { 
      loading, 
      isAuthenticated, 
      segments: segments.join('/'),
      hasNavigated: hasNavigated.current
    });
    
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inCaptainGroup = segments[0] === 'captain';
    const inCaptainAuthGroup = segments[0] === 'captain' && segments[1] === '(auth)';

    console.log('NavigationHandler: Route groups', { inAuthGroup, inAppGroup, inCaptainGroup, inCaptainAuthGroup });

    // Prevent infinite loops by checking if we've already navigated
    if (hasNavigated.current) {
      console.log('NavigationHandler: Already navigated, skipping');
      return;
    }

    if (!isAuthenticated && !inAuthGroup && !inCaptainAuthGroup) {
      console.log('NavigationHandler: Redirecting to captain auth');
      hasNavigated.current = true;
      // User is not authenticated and not in auth/captain auth group, redirect to captain auth
      router.replace('/captain/(auth)');
    } else if (isAuthenticated && !inAppGroup && !inCaptainGroup) {
      console.log('NavigationHandler: Redirecting to captain dashboard');
      hasNavigated.current = true;
      // User is authenticated and not in app/captain group, redirect to captain dashboard
      router.replace('/captain/(tabs)/home');
    } else {
      console.log('NavigationHandler: No redirect needed, staying on current route');
    }
  }, [isAuthenticated, loading]);

  // Reset navigation flag when auth state changes
  useEffect(() => {
    hasNavigated.current = false;
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <Slot />;
}

// Root Layout Component
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationHandler />
        <StatusBar style="dark" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
