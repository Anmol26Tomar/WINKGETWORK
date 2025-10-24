import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { captainAuthApi, setCaptainApiToken } from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { connectSocket } from '../lib/socket';
import { useAuth } from '@/context/AuthContext';

type VehicleType = 'bike' | 'truck' | 'cab';
type ServiceType = 'local_parcel' | 'intra_truck' | 'all_india_parcel' | 'cab_booking' | 'bike_ride' | 'packers_movers';

const VALID_SERVICES: Record<VehicleType, ServiceType[]> = {
  bike: ['local_parcel', 'bike_ride'],
  truck: ['intra_truck', 'all_india_parcel', 'packers_movers'],
  cab: ['cab_booking'],
};

export default function CaptainAuthScreen() {
  const router = useRouter();
  const { loginCaptain, signupCaptain, token } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Common fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [vehicleSubType, setVehicleSubType] = useState('');
  const [servicesOffered, setServicesOffered] = useState<ServiceType[]>([]);

  const handleServiceToggle = (service: ServiceType) => {
    setServicesOffered(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSignup = async () => {
    if (!name || !phone || !password || !city || !vehicleSubType || servicesOffered.length === 0) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting signup with data:', {
        name,
        phone,
        password: '***',
        vehicleType,
        vehicleSubType,
        servicesOffered,
        city,
      });

      // Use AuthContext signupCaptain
      const captain = await signupCaptain({
        name,
        phone,
        password,
        vehicleType,
        vehicleSubType,
        servicesOffered,
        city,
      });

      console.log('Signup successful:', captain);
      console.log('AuthContext state after signup:', { captain, token });

      // Set API token for future requests
      if (token) {
        setCaptainApiToken(token);
        console.log('API token set after signup');
      }

      // Connect socket after successful signup
      await connectSocket(token);

      // Navigate immediately without alert for faster UX
      console.log('Signup successful, redirecting to dashboard...');
      router.replace('/captain/(tabs)/home');
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Error', error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter phone and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with phone:', phone);

      // Use AuthContext loginCaptain
      const captain = await loginCaptain({
        email: phone, // AuthContext expects 'email' field but we're using phone
        password,
      });

      console.log('Login successful:', captain);
      console.log('AuthContext state after login:', { captain, token });

      // Set API token for future requests
      if (token) {
        setCaptainApiToken(token);
        console.log('API token set after login');
      }

      // Connect socket after successful login
      await connectSocket(token);

      // Navigate immediately without alert for faster UX
      console.log('Login successful, redirecting to dashboard...');
      router.replace('/captain/(tabs)/home');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    setLoading(true);
    try {
      await captainAuthApi.requestOtp({ phone });
      Alert.alert('Success', 'OTP sent to your phone', [
        { text: 'OK', onPress: () => router.push('/captain/(auth)/verify-otp') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, Captain</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to your account' : 'Create your captain account'}
        </Text>
      </View>

      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Signup</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#999"
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.vehicleTypeContainer}>
              {(['bike', 'truck', 'cab'] as VehicleType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.vehicleTypeButton,
                    vehicleType === type && styles.vehicleTypeButtonActive
                  ]}
                  onPress={() => {
                    setVehicleType(type);
                    setServicesOffered([]);
                  }}
                >
                  <Text style={[
                    styles.vehicleTypeText,
                    vehicleType === type && styles.vehicleTypeTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Vehicle Registration Number"
              placeholderTextColor="#999"
              value={vehicleSubType}
              onChangeText={setVehicleSubType}
            />

            <Text style={styles.label}>Services Offered</Text>
            <View style={styles.servicesContainer}>
              {VALID_SERVICES[vehicleType].map((service) => (
                <Pressable
                  key={service}
                  style={[
                    styles.serviceButton,
                    servicesOffered.includes(service) && styles.serviceButtonActive
                  ]}
                  onPress={() => handleServiceToggle(service)}
                >
                  <Text style={[
                    styles.serviceText,
                    servicesOffered.includes(service) && styles.serviceTextActive
                  ]}>
                    {service.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isLogin && (
          <Pressable style={styles.otpButton} onPress={handleRequestOtp}>
            <Text style={styles.otpButtonText}>Login with OTP</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={isLogin ? handleLogin : handleSignup}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Signup')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FDB813',
  },
  toggleText: {
    color: '#999',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000',
  },
  form: {
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  vehicleTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#FDB813',
    borderColor: '#FDB813',
  },
  vehicleTypeText: {
    color: '#999',
    fontWeight: '600',
  },
  vehicleTypeTextActive: {
    color: '#000',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555',
  },
  serviceButtonActive: {
    backgroundColor: '#FDB813',
    borderColor: '#FDB813',
  },
  serviceText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  serviceTextActive: {
    color: '#000',
  },
  otpButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  otpButtonText: {
    color: '#FDB813',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FDB813',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

