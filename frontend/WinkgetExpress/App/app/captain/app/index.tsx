import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ApprovalPending } from '../components/ApprovalPending';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, captain, approved, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      requestAnimationFrame(() => {
        if (isAuthenticated && approved) {
          router.replace('/captain/app/(captabs)');
        } else if (isAuthenticated && approved === false) {
          // Show approval pending screen
          return;
        } else {
          router.replace('/login');
        }
      });
    }
  }, [isAuthenticated, isLoading, approved]);

  // Show approval pending screen for unapproved captains
  if (isAuthenticated && approved === false && captain) {
    return (
      <ApprovalPending 
        agent={captain} 
        onLogout={() => {
          logout();
          router.replace('/login');
        }} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
