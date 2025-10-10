import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const VendorCard = ({ vendor, onPress }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#F59E0B" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#F59E0B" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#D1D5DB" />
      );
    }

    return stars;
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.vendorInfo}>
              <Title style={styles.vendorName}>{vendor.storeName}</Title>
              <Paragraph style={styles.vendorDescription}>
                {vendor.description || vendor.briefInfo}
              </Paragraph>
            </View>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(vendor.rating?.average || 0)}
              </View>
              <Text style={styles.ratingText}>
                {vendor.rating?.average?.toFixed(1) || '0.0'} ({vendor.rating?.count || 0})
              </Text>
            </View>
          </View>

          {vendor.categories && vendor.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {vendor.categories.slice(0, 3).map((category, index) => (
                <Chip key={index} style={styles.categoryChip} textStyle={styles.chipText}>
                  {category}
                </Chip>
              ))}
              {vendor.categories.length > 3 && (
                <Chip style={styles.moreChip} textStyle={styles.chipText}>
                  +{vendor.categories.length - 3}
                </Chip>
              )}
            </View>
          )}

          {vendor.address && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.locationText}>
                {vendor.address.city}, {vendor.address.state}
              </Text>
            </View>
          )}

          {vendor.operatingHours && vendor.operatingHours.length > 0 && (
            <View style={styles.hoursContainer}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.hoursText}>
                {vendor.operatingHours[0]?.isClosed ? 'Closed' : 
                 `${vendor.operatingHours[0]?.openTime} - ${vendor.operatingHours[0]?.closeTime}`}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorInfo: {
    flex: 1,
    marginRight: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  vendorDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#EFF6FF',
  },
  moreChip: {
    backgroundColor: '#F3F4F6',
  },
  chipText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default VendorCard;
