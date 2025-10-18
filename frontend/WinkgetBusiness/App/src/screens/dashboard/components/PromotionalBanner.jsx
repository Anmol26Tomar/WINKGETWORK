import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PromotionalBanner = ({ onBannerPress }) => {
  const banners = [
    {
      id: 1,
      title: "Thinking to",
      subtitle: "Buying a House",
      description: "We help you to find your Dream house",
      buttonText: "Luxury property for sale",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=200&fit=crop"
    },
    {
      id: 2,
      title: "The AFFORDABLE",
      subtitle: "LUXURY HOTEL",
      description: "Book your stay now",
      buttonText: "BOOK NOW",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop"
    },
    {
      id: 3,
      title: "PACKERS & MOVERS",
      subtitle: "Reliable Service",
      description: "Move with confidence",
      buttonText: "GET BEST DEAL",
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop"
    }
  ];

  const renderBanner = (banner, index) => (
    <TouchableOpacity
      key={banner.id}
      style={styles.bannerCard}
      onPress={() => onBannerPress?.(banner)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={index === 0 ? ["#667eea", "#764ba2"] : index === 1 ? ["#f093fb", "#f5576c"] : ["#4facfe", "#00f2fe"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
            <Text style={styles.bannerDescription}>{banner.description}</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>{banner.buttonText}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bannerImageContainer}>
            <View style={styles.bannerImagePlaceholder}>
              <Ionicons name="business" size={40} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        pagingEnabled
        decelerationRate="fast"
      >
        {banners.map((banner, index) => renderBanner(banner, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bannerCard: {
    width: 320,
    height: 180,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerGradient: {
    flex: 1,
    padding: 20,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    paddingRight: 16,
  },
  bannerTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
  },
  bannerDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    lineHeight: 16,
  },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerImageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PromotionalBanner;
