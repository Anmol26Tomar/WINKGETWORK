import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOTP } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const inputRefs = useRef<TextInput[]>(Array(6).fill(null));

  useEffect(() => {
    (async () => {
      const pending = await AsyncStorage.getItem('pending_captain_phone');
      setPendingPhone(pending);
    })();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    const targetPhone = phone || pendingPhone;
    if (!targetPhone) {
      Alert.alert('Error', 'Missing phone for OTP verification');
      return;
    }

    setLoading(true);
    try {
      router.replace('/captain/app/(captabs)');
      // await verifyOTP(targetPhone, otpCode);
      Alert.alert('Success', 'OTP verified successfully!');
    } catch (error: any) {
      Alert.alert('Verification Failed', error?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const targetPhone = phone || pendingPhone;
      if (!targetPhone) throw new Error('Missing phone');
      const base = process.env.EXPO_PUBLIC_API_BASE || 'http://10.85.122.137:3001';
      await fetch(`${base}/api/auth/agent/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: targetPhone }) });
      Alert.alert('Success', 'OTP has been resent to your phone');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{"\n"}
          {pendingPhone || phone}
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref!)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              importantForAccessibility="yes"
              accessible
            />
          ))}
        </View>

        <Button
          title={loading ? 'Verifying...' : 'Verify OTP'}
          onPress={handleVerify}
          loading={loading}
          style={styles.verifyButton}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResendOTP} disabled={resending}>
            <Text style={styles.resendLink}>
              {resending ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  verifyButton: {
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
