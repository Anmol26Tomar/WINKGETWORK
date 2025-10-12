import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Card,
  RadioButton,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PaymentScreen = ({ route, navigation }) => {
  const { 
    product, 
    quantity, 
    deliveryAddress, 
    email, 
    useGSTInvoice, 
    selectedDelivery, 
    subtotal, 
    protectPromiseFee, 
    total, 
    savings 
  } = route.params;
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString() || "0"}`;
  };

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Order Placed Successfully!',
        `Your order for ${product.title || product.name} has been placed successfully. Order ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home or order confirmation
              navigation.navigate('DashboardMain');
            }
          }
        ]
      );
    }, 3000);
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressStep}>
        <View style={[styles.progressCircle, styles.progressCircleCompleted]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={styles.progressText}>Address</Text>
      </View>
      
      <View style={styles.progressLine} />
      
      <View style={styles.progressStep}>
        <View style={[styles.progressCircle, styles.progressCircleCompleted]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={styles.progressText}>Order Summary</Text>
      </View>
      
      <View style={styles.progressLine} />
      
      <View style={styles.progressStep}>
        <View style={[styles.progressCircle, styles.progressCircleActive]}>
          <Text style={styles.progressNumber}>3</Text>
        </View>
        <Text style={[styles.progressText, styles.progressTextActive]}>Payment</Text>
      </View>
    </View>
  );

  const renderOrderSummary = () => (
    <Card style={styles.summaryCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items ({quantity})</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Protect Promise Fee</Text>
          <Text style={styles.summaryValue}>{formatPrice(protectPromiseFee)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.summaryValue}>Free</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        
        <View style={styles.savingsRow}>
          <Ionicons name="percent" size={16} color="#10B981" />
          <Text style={styles.savingsText}>
            You saved {formatPrice(savings)} on this order!
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPaymentMethods = () => (
    <Card style={styles.paymentCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setSelectedPaymentMethod('upi')}
        >
          <View style={styles.paymentOptionLeft}>
            <View style={styles.paymentIcon}>
              <Ionicons name="phone-portrait" size={20} color="#3B82F6" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>UPI</Text>
              <Text style={styles.paymentSubtitle}>Pay using UPI ID or QR Code</Text>
            </View>
          </View>
          <RadioButton
            value="upi"
            status={selectedPaymentMethod === 'upi' ? 'checked' : 'unchecked'}
            onPress={() => setSelectedPaymentMethod('upi')}
            color="#10B981"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setSelectedPaymentMethod('card')}
        >
          <View style={styles.paymentOptionLeft}>
            <View style={styles.paymentIcon}>
              <Ionicons name="card" size={20} color="#6B7280" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
              <Text style={styles.paymentSubtitle}>Visa, Mastercard, RuPay</Text>
            </View>
          </View>
          <RadioButton
            value="card"
            status={selectedPaymentMethod === 'card' ? 'checked' : 'unchecked'}
            onPress={() => setSelectedPaymentMethod('card')}
            color="#10B981"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setSelectedPaymentMethod('netbanking')}
        >
          <View style={styles.paymentOptionLeft}>
            <View style={styles.paymentIcon}>
              <Ionicons name="business" size={20} color="#6B7280" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Net Banking</Text>
              <Text style={styles.paymentSubtitle}>All major banks supported</Text>
            </View>
          </View>
          <RadioButton
            value="netbanking"
            status={selectedPaymentMethod === 'netbanking' ? 'checked' : 'unchecked'}
            onPress={() => setSelectedPaymentMethod('netbanking')}
            color="#10B981"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setSelectedPaymentMethod('wallet')}
        >
          <View style={styles.paymentOptionLeft}>
            <View style={styles.paymentIcon}>
              <Ionicons name="wallet" size={20} color="#6B7280" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Digital Wallet</Text>
              <Text style={styles.paymentSubtitle}>Paytm, PhonePe, Google Pay</Text>
            </View>
          </View>
          <RadioButton
            value="wallet"
            status={selectedPaymentMethod === 'wallet' ? 'checked' : 'unchecked'}
            onPress={() => setSelectedPaymentMethod('wallet')}
            color="#10B981"
          />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  const renderDeliveryInfo = () => (
    <Card style={styles.deliveryCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        
        <View style={styles.deliveryRow}>
          <Ionicons name="person" size={16} color="#6B7280" />
          <Text style={styles.deliveryText}>{deliveryAddress.name}</Text>
        </View>
        
        <View style={styles.deliveryRow}>
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text style={styles.deliveryText}>{deliveryAddress.address}</Text>
        </View>
        
        <View style={styles.deliveryRow}>
          <Ionicons name="call" size={16} color="#6B7280" />
          <Text style={styles.deliveryText}>{deliveryAddress.phone}</Text>
        </View>
        
        {email && (
          <View style={styles.deliveryRow}>
            <Ionicons name="mail" size={16} color="#6B7280" />
            <Text style={styles.deliveryText}>{email}</Text>
          </View>
        )}
        
        <View style={styles.deliveryRow}>
          <Ionicons name="car" size={16} color="#10B981" />
          <Text style={styles.deliveryText}>EXPRESS Delivery in 2 days, Tue</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerButton} />
      </View>

      {renderProgressIndicator()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderOrderSummary()}
        {renderPaymentMethods()}
        {renderDeliveryInfo()}
      </ScrollView>

      {/* Bottom Payment Bar */}
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={['#F8FAFC', '#FFFFFF']}
          style={styles.bottomGradient}
        >
          <View style={styles.paymentContainer}>
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentTotalLabel}>Total Amount</Text>
              <Text style={styles.paymentTotalValue}>{formatPrice(total)}</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Text style={styles.payButtonText}>Processing...</Text>
              ) : (
                <>
                  <Ionicons name="lock-closed" size={20} color="white" />
                  <Text style={styles.payButtonText}>Pay {formatPrice(total)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleCompleted: {
    backgroundColor: '#3B82F6',
  },
  progressCircleActive: {
    backgroundColor: '#3B82F6',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summaryCard: {
    margin: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  savingsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  deliveryCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentSummary: {
    flex: 1,
  },
  paymentTotalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});

export default PaymentScreen;
