import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const HomeScreen = () => {
  const { user } = useAuth();
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
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Animated.View 
            style={[styles.welcomeContainer, { opacity: fadeAnim }]}
          >
            <Ionicons name="home" size={64} color="white" />
            <Title style={styles.welcomeTitle}>Dashboard</Title>
            <Text style={styles.welcomeSubtitle}>
              Welcome back, {user?.name || 'User'}!
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Card style={styles.overviewCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.overviewTitle}>📊 Business Overview</Title>
            <Paragraph style={styles.overviewText}>
              Your business dashboard provides a comprehensive view of your operations, 
              sales performance, and key metrics.
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.statsTitle}>Quick Stats</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>₹0</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.quickActionsCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.quickActionsTitle}>Quick Actions</Title>
            <View style={styles.actionsGrid}>
              <Button mode="contained" style={styles.actionButton}>
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.actionText}>Add Product</Text>
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                <Ionicons name="list" size={16} color="#3B82F6" />
                <Text style={styles.actionText}>View Orders</Text>
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                <Ionicons name="analytics" size={16} color="#3B82F6" />
                <Text style={styles.actionText}>Analytics</Text>
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                <Ionicons name="settings" size={16} color="#3B82F6" />
                <Text style={styles.actionText}>Settings</Text>
              </Button>
            </View>
          </Card.Content>
        </Card>
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
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 12,
  },
  welcomeSubtitle: {
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
  overviewCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overviewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  overviewText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 26,
  },
  statsCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionsCard: {
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
