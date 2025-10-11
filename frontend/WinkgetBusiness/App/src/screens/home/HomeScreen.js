import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const HomeScreen = () => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Ionicons name="home" size={64} color="white" />
            <Title style={styles.welcomeTitle}>Dashboard</Title>
            <Text style={styles.welcomeSubtitle}>
              Welcome back, {user?.name || 'User'}!
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Title style={styles.overviewTitle}>📊 Business Overview</Title>
            <Paragraph style={styles.overviewText}>
              Your business dashboard provides a comprehensive view of your operations, 
              sales performance, and key metrics.
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
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
          <Card.Content>
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  overviewCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  statsCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActionsCard: {
    elevation: 2,
    borderRadius: 12,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
