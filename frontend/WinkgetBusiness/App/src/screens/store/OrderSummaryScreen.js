import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import {
  Card,
  Button,
  Surface,
  Divider,
  Checkbox,
  RadioButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const OrderSummaryScreen = ({ route, navigation }) => {
  const { product, quantity: initialQuantity = 1, deliveryAddress: passedAddress } = route.params;
  const { addToCart, updateQuantity, removeFromCart } = useCart();
  
  const [quantity, setQuantity] = useState(initialQuantity);
  const [deliveryAddress, setDeliveryAddress] = useState(passedAddress || {
    name: '',
    address: '',
    phone: '',
  });
  const [email, setEmail] = useState('');
  const [useGSTInvoice, setUseGSTInvoice] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState('express');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString() || "0"}`;
  };

  const calculateDiscount = () => {
    if (product.maxSellingPrice && product.maxSellingPrice > product.price) {
      return Math.round(((product.maxSellingPrice - product.price) / product.maxSellingPrice) * 100);
    }
    return 0;
  };

  const calculateSavings = () => {
    if (product.maxSellingPrice && product.maxSellingPrice > product.price) {
      return (product.maxSellingPrice - product.price) * quantity;
    }
    return 0;
  };

  const calculateSubtotal = () => {
    return product.price * quantity;
  };

  const calculateProtectPromiseFee = () => {
    return Math.round(calculateSubtotal() * 0.003); // 0.3% of subtotal
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateProtectPromiseFee();
  };

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
    setShowQuantityModal(false);
  };

  const handleChangeAddress = () => {
    navigation.navigate('Address', {
      product,
      quantity,
      deliveryAddress, // Pass current address to pre-fill form
    });
  };

  const handleContinue = () => {
    // Add item to cart with selected quantity
    addToCart(product, quantity);
    
    // Navigate to payment page
    navigation.navigate('Payment', {
      product,
      quantity,
      deliveryAddress,
      email,
      useGSTInvoice,
      selectedDelivery,
      subtotal: calculateSubtotal(),
      protectPromiseFee: calculateProtectPromiseFee(),
      total: calculateTotal(),
      savings: calculateSavings(),
    });
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
        <View style={[styles.progressCircle, styles.progressCircleActive]}>
          <Text style={styles.progressNumber}>2</Text>
        </View>
        <Text style={[styles.progressText, styles.progressTextActive]}>Order Summary</Text>
      </View>
      
      <View style={styles.progressLine} />
      
      <View style={styles.progressStep}>
        <View style={[styles.progressCircle, styles.progressCircleInactive]}>
          <Text style={styles.progressNumberInactive}>3</Text>
        </View>
        <Text style={styles.progressText}>Payment</Text>
      </View>
    </View>
  );

  const renderDeliveryAddress = () => (
    <Card style={styles.addressCard}>
      <Card.Content>
        <View style={styles.addressHeader}>
          <Text style={styles.sectionTitle}>Deliver to:</Text>
          <TouchableOpacity onPress={handleChangeAddress}>
            <Text style={styles.changeButton}>Change</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.addressName}>{deliveryAddress.name}</Text>
        <Text style={styles.addressText}>{deliveryAddress.address}</Text>
        <Text style={styles.addressPhone}>{deliveryAddress.phone}</Text>
      </Card.Content>
    </Card>
  );

  const renderProductDetails = () => (
    <Card style={styles.productCard}>
      <Card.Content>
        <View style={styles.productContainer}>
          <Image
            source={{
              uri: product.images?.[0] || product.image || 'https://via.placeholder.com/100',
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title || product.name}
            </Text>
            <Text style={styles.productSpecs}>8 GB RAM</Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={12}
                    color="#10B981"
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>4.5</Text>
              <Text style={styles.reviewCount}>(7,368)</Text>
              <View style={styles.assuredBadge}>
                <Text style={styles.assuredText}>Assured</Text>
              </View>
            </View>
            
            <View style={styles.discountContainer}>
              <Ionicons name="arrow-down" size={16} color="#10B981" />
              <Text style={styles.discountText}>{calculateDiscount()}%</Text>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>{formatPrice(product.maxSellingPrice || product.price)}</Text>
              <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.quantitySelector}
              onPress={() => setShowQuantityModal(true)}
            >
              <Text style={styles.quantityText}>Qty: {quantity}</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
            
            <View style={styles.feeContainer}>
              <Text style={styles.feeText}>+ {formatPrice(calculateProtectPromiseFee())} Protect Promise Fee</Text>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            </View>
            
            <Text style={styles.alternativePayment}>
              Or Pay {formatPrice(calculateSubtotal())} + 🪙 100
            </Text>
            
            <View style={styles.deliveryInfo}>
              <Ionicons name="car" size={16} color="#10B981" />
              <Text style={styles.deliveryText}>EXPRESS Delivery in 2 days, Tue</Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAdditionalOptions = () => (
    <Card style={styles.optionsCard}>
      <Card.Content>
        <View style={styles.optionRow}>
          <Ionicons name="document-text-outline" size={20} color="#6B7280" />
          <Text style={styles.optionText}>Email ID required for delivery</Text>
          <TouchableOpacity>
            <Text style={styles.addButton}>Add Email</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.checkboxRow}>
          <Checkbox
            status={useGSTInvoice ? 'checked' : 'unchecked'}
            onPress={() => setUseGSTInvoice(!useGSTInvoice)}
            color="#10B981"
          />
          <Text style={styles.checkboxText}>Use GST Invoice</Text>
        </View>
        
        <View style={styles.optionRow}>
          <Ionicons name="ribbon-outline" size={20} color="#F59E0B" />
          <Text style={styles.optionText}>Rest assured with Open Box Delivery</Text>
        </View>
        
        <View style={styles.savingsRow}>
          <Ionicons name="percent" size={20} color="#10B981" />
          <Text style={styles.savingsText}>
            You'll save {formatPrice(calculateSavings())} on this order!
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderQuantityModal = () => (
    <Modal
      visible={showQuantityModal}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.quantityModal}>
          <Text style={styles.modalTitle}>Select Quantity</Text>
          <View style={styles.quantityOptions}>
            {[1, 2, 3, 4, 5].map((qty) => (
              <TouchableOpacity
                key={qty}
                style={[
                  styles.quantityOption,
                  quantity === qty && styles.quantityOptionSelected
                ]}
                onPress={() => handleQuantityChange(qty)}
              >
                <Text style={[
                  styles.quantityOptionText,
                  quantity === qty && styles.quantityOptionTextSelected
                ]}>
                  {qty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowQuantityModal(false)}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={styles.headerButton} />
      </View>

      {renderProgressIndicator()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderDeliveryAddress()}
        {renderProductDetails()}
        {renderAdditionalOptions()}
      </ScrollView>

      {/* Bottom Summary Bar */}
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={['#F8FAFC', '#FFFFFF']}
          style={styles.bottomGradient}
        >
          <View style={styles.summaryContainer}>
            <View style={styles.priceSummary}>
              <Text style={styles.originalPriceSummary}>
                {formatPrice(product.maxSellingPrice || product.price)}
              </Text>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <View style={styles.totalPriceContainer}>
                  <Text style={styles.totalPrice}>{formatPrice(calculateTotal())}</Text>
                  <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {renderQuantityModal()}
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
  progressCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  progressNumberInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
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
  addressCard: {
    margin: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  changeButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  productCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productContainer: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  productSpecs: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  assuredBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assuredText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 14,
    color: '#1F2937',
    marginRight: 4,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feeText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  alternativePayment: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  optionsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  addButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 12,
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
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSummary: {
    flex: 1,
  },
  originalPriceSummary: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  totalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 4,
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  quantityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quantityOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityOptionSelected: {
    backgroundColor: '#10B981',
  },
  quantityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  quantityOptionTextSelected: {
    color: 'white',
  },
  modalCloseButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default OrderSummaryScreen;
