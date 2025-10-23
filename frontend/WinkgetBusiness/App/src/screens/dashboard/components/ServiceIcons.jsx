import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ServiceIcons = ({ onServicePress }) => {
  const services = [
    {
      id: 'jiomart',
      name: 'JioMart',
      subtitle: 'SHOPPING',
      icon: 'bag',
      color: '#0D9488',
      onPress: () => onServicePress?.('jiomart')
    },
    {
      id: 'ajio',
      name: 'AJIO',
      subtitle: 'FASHION',
      icon: 'shirt',
      color: '#374151',
      onPress: () => onServicePress?.('ajio')
    },
    {
      id: 'tira',
      name: 'tira',
      subtitle: 'BEAUTY',
      icon: 'sparkles',
      color: '#F472B6',
      onPress: () => onServicePress?.('tira')
    },
    {
      id: 'bills',
      name: 'PAY BILLS',
      subtitle: '',
      icon: 'card',
      color: '#1E40AF',
      onPress: () => onServicePress?.('bills')
    }
  ];

  return (
    <View style={styles.container}>
      {services.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[styles.serviceCard, { backgroundColor: service.color }]}
          activeOpacity={0.8}
          onPress={service.onPress}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name={service.icon} 
              size={24} 
              color="white" 
            />
          </View>
          <Text style={styles.serviceName}>{service.name}</Text>
          {service.subtitle && (
            <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default ServiceIcons;
