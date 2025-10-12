import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { X, QrCode, CheckCircle } from 'lucide-react-native';
import { AnimatedButton } from './AnimatedButton';

const { width, height } = Dimensions.get('window');

interface FakePaymentQRModalProps {
  visible: boolean;
  amount: number;
  onPaymentConfirmed: () => void;
  onClose: () => void;
}

export const FakePaymentQRModal: React.FC<FakePaymentQRModalProps> = ({
  visible,
  amount,
  onPaymentConfirmed,
  onClose,
}) => {
  const [paymentStep, setPaymentStep] = useState<'qr' | 'processing' | 'success'>('qr');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const qrPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setPaymentStep('qr');
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start QR pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(qrPulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(qrPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePayment = () => {
    setPaymentStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStep('success');
      
      // Auto close after success
      setTimeout(() => {
        onPaymentConfirmed();
        onClose();
      }, 2000);
    }, 2000);
  };

  const renderQRCode = () => (
    <Animated.View
      style={[
        styles.qrContainer,
        {
          transform: [{ scale: qrPulseAnim }],
        },
      ]}
    >
      <View style={styles.qrCode}>
        <QrCode size={120} color="#1F2937" />
      </View>
      <Text style={styles.qrText}>Scan QR Code to Pay</Text>
    </Animated.View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={styles.loadingSpinner}>
        <Text style={styles.loadingText}>Processing Payment...</Text>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <CheckCircle size={80} color="#10B981" />
      <Text style={styles.successText}>Payment Successful!</Text>
      <Text style={styles.successSubtext}>₹{amount} received</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount to Pay</Text>
              <Text style={styles.amount}>₹{amount}</Text>
            </View>

            {paymentStep === 'qr' && renderQRCode()}
            {paymentStep === 'processing' && renderProcessing()}
            {paymentStep === 'success' && renderSuccess()}

            {paymentStep === 'qr' && (
              <AnimatedButton
                title="Simulate Payment"
                onPress={handlePayment}
                variant="success"
                size="large"
                style={styles.payButton}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrCode: {
    width: 150,
    height: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  qrText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  processingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingSpinner: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 16,
  },
  successSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  payButton: {
    width: '100%',
  },
});

