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

const MyBusinessScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="business" size={48} color="white" />
            <Title style={styles.title}>My Business</Title>
            <Text style={styles.subtitle}>Manage your business operations</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Card.Content>
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
          <Card.Content>
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
          <Card.Content>
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
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  analyticsCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analyticsItem: {
    alignItems: 'center',
  },
  analyticsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  analyticsLabel: {
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
  },
});

export default MyBusinessScreen;
