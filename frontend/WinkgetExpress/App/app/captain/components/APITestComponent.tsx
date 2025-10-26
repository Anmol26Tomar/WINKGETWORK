import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { captainAuthApi } from '../lib/api';

export default function APITestComponent() {
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    try {
      console.log('Testing signup API...');
      const response = await captainAuthApi.signup({
        name: 'Test Captain',
        phone: '9876543210',
        password: 'password123',
        vehicleType: 'bike',
        vehicleSubType: 'bike_standard',
        servicesOffered: ['local_parcel'],
        city: 'Mumbai'
      });
      
      console.log('Signup successful:', response.data);
      Alert.alert('Success', 'API Test Passed! Signup successful.');
    } catch (error: any) {
      console.error('API Test failed:', error);
      Alert.alert('Error', `API Test Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      console.log('Testing login API...');
      const response = await captainAuthApi.loginPassword({
        phone: '9876543210',
        password: 'password123'
      });
      
      console.log('Login successful:', response.data);
      Alert.alert('Success', 'API Test Passed! Login successful.');
    } catch (error: any) {
      console.error('API Test failed:', error);
      Alert.alert('Error', `API Test Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Integration Test</Text>
      <Text style={styles.subtitle}>Test backend connectivity</Text>
      
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Signup API'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Login API'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#86CB92',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
