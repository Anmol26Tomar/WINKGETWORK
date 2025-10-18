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
import LoadingSpinner from '../../components/LoadingSpinner';

const MyBusinessScreen = () => {
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
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1300);
  };

  if (loading) {
    return <LoadingSpinner text="Loading your business..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Animated.View 
            style={[styles.titleContainer, { opacity: fadeAnim }]}
          >
            <Ionicons name="business" size={48} color="white" />
            <Title style={styles.title}>My Business</Title>
            <Text style={styles.subtitle}>Manage your business operations</Text>
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Card style={styles.infoCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.infoTitle}>🏢 Business Management</Title>
            <Paragraph style={styles.infoText}>
              This is your business dashboard where you can manage your business profile, 
              settings, analytics, and overall business operations.
            </Paragraph>
            <Button mode="contained" style={styles.button}>
              Business Settings
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.analyticsCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.analyticsTitle}>Business Analytics</Title>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsNumber}>0</Text>
                <Text style={styles.analyticsLabel}>Total Sales</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsNumber}>0</Text>
                <Text style={styles.analyticsLabel}>Customers</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsNumber}>0%</Text>
                <Text style={styles.analyticsLabel}>Growth</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.quickActionsCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.quickActionsTitle}>Quick Actions</Title>
            <View style={styles.actionsGrid}>
              <Button mode="outlined" style={styles.actionButton}>
                View Reports
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                Manage Staff
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                Business Hours
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                Notifications
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
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
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
  infoCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 26,
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  analyticsCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  analyticsItem: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  analyticsLabel: {
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
    borderRadius: 12,
  },
});

export default MyBusinessScreen;
