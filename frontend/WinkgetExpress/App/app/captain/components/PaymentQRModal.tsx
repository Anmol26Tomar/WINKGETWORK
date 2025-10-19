import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';

interface PaymentQRModalProps {
  visible: boolean;
  amount: number;
  onPaymentConfirmed: () => void;
  onClose: () => void;
}

export function PaymentQRModal({
  visible,
  amount,
  onPaymentConfirmed,
  onClose,
}: PaymentQRModalProps) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirmPayment = async () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      onPaymentConfirmed();
    }, 1000);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Payment">
      <View style={styles.container}>
        <Text style={styles.amountLabel}>Amount to Collect</Text>
        <Text style={styles.amount}>₹{amount.toFixed(2)}</Text>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR CODE</Text>
            <Text style={styles.qrSubtext}>Scan to Pay</Text>
          </View>
        </View>

        <Text style={styles.instruction}>
          Ask the customer to scan the QR code to complete the payment
        </Text>

        <View style={styles.actions}>
          <Button
            title="Payment Received"
            onPress={handleConfirmPayment}
            loading={confirming}
          />
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.cancelButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 24,
  },
  qrContainer: {
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  qrText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    marginTop: 0,
  },
});

export default PaymentQRModal;