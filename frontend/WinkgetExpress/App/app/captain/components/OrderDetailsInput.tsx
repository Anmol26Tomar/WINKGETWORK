import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input } from './Input';
import type { OrderDetails } from '../types';

interface OrderDetailsInputProps {
  serviceType: string;
  value: OrderDetails;
  onChange: (details: OrderDetails) => void;
}

export const OrderDetailsInput: React.FC<OrderDetailsInputProps> = ({
  serviceType,
  value,
  onChange,
}) => {
  const isParcelService = serviceType.toLowerCase().includes('parcel') ||
                          serviceType.toLowerCase().includes('delivery');
  const isTruckService = serviceType.toLowerCase().includes('truck') ||
                         serviceType.toLowerCase().includes('movers');
  const isCabService = serviceType.toLowerCase().includes('cab') ||
                       serviceType.toLowerCase().includes('ride');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Order Details</Text>

      {(isParcelService || isTruckService) && (
        <>
          <View style={styles.section}>
            <Input
              label="Weight (kg)"
              placeholder="Enter weight in kg"
              value={value.weight?.toString() || ''}
              onChangeText={(text) => onChange({ ...value, weight: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Dimensions (cm)</Text>
            <View style={styles.dimensionRow}>
              <Input
                label="Length"
                placeholder="L"
                value={value.dimensions?.length?.toString() || ''}
                onChangeText={(text) =>
                  onChange({
                    ...value,
                    dimensions: {
                      ...value.dimensions,
                      length: parseFloat(text) || 0,
                      width: value.dimensions?.width || 0,
                      height: value.dimensions?.height || 0
                    }
                  })
                }
                keyboardType="decimal-pad"
                style={styles.dimensionInput}
              />
              <Input
                label="Width"
                placeholder="W"
                value={value.dimensions?.width?.toString() || ''}
                onChangeText={(text) =>
                  onChange({
                    ...value,
                    dimensions: {
                      ...value.dimensions,
                      width: parseFloat(text) || 0,
                      length: value.dimensions?.length || 0,
                      height: value.dimensions?.height || 0
                    }
                  })
                }
                keyboardType="decimal-pad"
                style={styles.dimensionInput}
              />
              <Input
                label="Height"
                placeholder="H"
                value={value.dimensions?.height?.toString() || ''}
                onChangeText={(text) =>
                  onChange({
                    ...value,
                    dimensions: {
                      ...value.dimensions,
                      height: parseFloat(text) || 0,
                      length: value.dimensions?.length || 0,
                      width: value.dimensions?.width || 0
                    }
                  })
                }
                keyboardType="decimal-pad"
                style={styles.dimensionInput}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Input
              label="Package Type"
              placeholder="e.g., Electronics, Furniture, Documents"
              value={value.packageType || ''}
              onChangeText={(text) => onChange({ ...value, packageType: text })}
            />
          </View>
        </>
      )}

      {isCabService && (
        <View style={styles.section}>
          <Input
            label="Number of Passengers"
            placeholder="Enter passenger count"
            value={value.passengers?.toString() || ''}
            onChangeText={(text) => onChange({ ...value, passengers: parseInt(text) || 1 })}
            keyboardType="number-pad"
          />
        </View>
      )}

      <View style={styles.section}>
        <Input
          label="Special Instructions"
          placeholder="Any special handling requirements..."
          value={value.specialInstructions || ''}
          onChangeText={(text) => onChange({ ...value, specialInstructions: text })}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dimensionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dimensionInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});
