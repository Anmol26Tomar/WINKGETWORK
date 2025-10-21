import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { Card, Title, Paragraph, Button, List } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  if (loading) {
    return <LoadingSpinner text="Loading your profile..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Animated.View 
            style={[styles.profileContainer, { opacity: fadeAnim }]}
          >
            <Ionicons name="person-circle" size={80} color="white" />
            <Title style={styles.name}>{user?.name || 'User'}</Title>
            <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.profileTitle}>Profile Information</Title>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
            {user?.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            )}
            <Button mode="outlined" style={styles.editButton}>
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.settingsTitle}>Settings</Title>
            <List.Item
              title="Account Settings"
              description="Manage your account preferences"
              left={(props) => <List.Icon {...props} icon="account-cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.listItem}
            />
            <List.Item
              title="Notifications"
              description="Configure notification settings"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.listItem}
            />
            <List.Item
              title="Privacy & Security"
              description="Manage your privacy settings"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.listItem}
            />
            <List.Item
              title="Help & Support"
              description="Get help and contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
  },
  profileContainer: {
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 12,
  },
  email: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  cardContent: {
    padding: 20,
  },
  profileCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  editButton: {
    marginTop: 20,
    borderRadius: 12,
  },
  settingsCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  listItem: {
    paddingVertical: 8,
    marginVertical: 4,
  },
  logoutButton: {
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProfileScreen;
