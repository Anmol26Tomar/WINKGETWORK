import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const FestivalBanner = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#3B82F6', '#E0F2FE']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={styles.mainTitle}>Make Every Festival</Text>
            <Text style={styles.mainTitle}>Grand & Glorious!</Text>
            <Text style={styles.subtitle}>Book the Best Mandap Decorators</Text>
            <Text style={styles.subtitle}>near you</Text>
            
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.visualSection}>
            <View style={styles.mandapContainer}>
              {/* Mandap structure */}
              <View style={styles.mandapFrame}>
                <View style={styles.mandapTop} />
                <View style={styles.mandapLeft} />
                <View style={styles.mandapRight} />
                <View style={styles.mandapBack} />
              </View>
              
              {/* Decorative elements */}
              <View style={styles.lantern1}>
                <Ionicons name="bulb" size={12} color="#F59E0B" />
              </View>
              <View style={styles.lantern2}>
                <Ionicons name="bulb" size={10} color="#F59E0B" />
              </View>
              <View style={styles.lantern3}>
                <Ionicons name="bulb" size={8} color="#F59E0B" />
              </View>
              
              {/* Flower garlands */}
              <View style={styles.garland1}>
                <View style={styles.flower} />
                <View style={styles.flower} />
                <View style={styles.flower} />
              </View>
              <View style={styles.garland2}>
                <View style={styles.flower} />
                <View style={styles.flower} />
                <View style={styles.flower} />
              </View>
              
              {/* Platform */}
              <View style={styles.platform} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
    minHeight: 140,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
    paddingRight: 16,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  exploreButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  exploreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  visualSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandapContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandapFrame: {
    position: 'absolute',
    width: 60,
    height: 50,
  },
  mandapTop: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  mandapLeft: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 4,
    height: 40,
    backgroundColor: '#F59E0B',
  },
  mandapRight: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 4,
    height: 40,
    backgroundColor: '#F59E0B',
  },
  mandapBack: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: '#F59E0B',
  },
  lantern1: {
    position: 'absolute',
    top: 8,
    left: 15,
    width: 16,
    height: 16,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lantern2: {
    position: 'absolute',
    top: 12,
    right: 10,
    width: 12,
    height: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lantern3: {
    position: 'absolute',
    top: 16,
    left: 5,
    width: 10,
    height: 10,
    backgroundColor: '#F59E0B',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  garland1: {
    position: 'absolute',
    top: 20,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  garland2: {
    position: 'absolute',
    top: 25,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  flower: {
    width: 6,
    height: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  platform: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
});

export default FestivalBanner;
