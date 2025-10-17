import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from './SearchBar';

const HeaderSection = ({ searchValue, onSearchChange, onSearchPress, onFilterPress, onNotificationPress }) => {
  return (
    <LinearGradient
      colors={["#007BFF", "#4FC3F7", "#EAF3FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        {/* Top Row with Brand and Icons */}
        <View style={styles.topRow}>
          <View style={styles.brandContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={24} color="#007BFF" />
            </View>
            <Text style={styles.brandTitle}>Winkget</Text>
          </View>
          
          <View style={styles.rightIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onFilterPress}
              activeOpacity={0.7}
            >
              <Ionicons name="filter" size={20} color="#007BFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color="#007BFF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Search across 10 Lakh + Business
        </Text>

        <SearchBar
          value={searchValue}
          onChangeText={onSearchChange}
          onSearchPress={onSearchPress}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Inter',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#F0F9FF',
    opacity: 0.9,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});

export default HeaderSection;
