import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const MapSection = ({ location, generateMapHTML }) => {
  return (
    <View style={styles.card}>
      <LinearGradient colors={["#FFFFFF", "#F8FAFF"]} style={styles.cardInner}>
        <Text style={styles.title}>Your Location</Text>
        <View style={styles.mapContainer}>
          {location ? (
            <WebView
              style={styles.map}
              source={{ html: generateMapHTML(location.latitude, location.longitude) }}
              javaScriptEnabled
              domStorageEnabled
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.placeholderText}>Fetching your location...</Text>
            </View>
          )}
          {location && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 20,
  },
  cardInner: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  mapContainer: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6B7280',
  },
  tooltip: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
});

export default MapSection;


