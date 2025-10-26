import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { getSocket } from '../lib/socket';

export default function PaymentQRScreen() {
  const router = useRouter();
  const { tripId, paymentUrl } = useLocalSearchParams<{ tripId: string; paymentUrl: string }>();
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      // Listen for trip completion
      socket.on('trip:completed', (data) => {
        if (data.tripId === tripId) {
          setPaymentCompleted(true);
          Alert.alert('Success', 'Payment completed! Trip finished.', [
            { text: 'OK', onPress: () => router.replace('/captain') }
          ]);
        }
      });

      return () => {
        socket.off('trip:completed');
      };
    }
  }, [tripId]);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Payment QR Code</Text>
        <Text style={styles.subtitle}>
          Show this QR code to the customer for payment
        </Text>
      </View>

      <View style={styles.qrContainer}>
        <QRCode
          value={paymentUrl || 'https://example.com/payment'}
          size={250}
          backgroundColor="#fff"
          color="#000"
        />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          1. Show this QR code to the customer
        </Text>
        <Text style={styles.instructionText}>
          2. Customer scans and completes payment
        </Text>
        <Text style={styles.instructionText}>
          3. You'll be notified when payment is complete
        </Text>
      </View>

      {paymentCompleted && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Payment Completed!</Text>
          <Pressable
            style={styles.successButton}
            onPress={() => router.replace('/captain')}
          >
            <Text style={styles.successButtonText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    paddingTop: 60,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#86CB92',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  instructions: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  successContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  successButton: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  successButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

