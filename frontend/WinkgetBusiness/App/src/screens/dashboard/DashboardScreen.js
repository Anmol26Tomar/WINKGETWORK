import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { MAPTILER_CONFIG } from '../../config/maptiler';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { rawCategories } from '../../utils/categories';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getLocationPermission();
    loadCategories();
  }, []);

  const generateMapHTML = (lat, lng) => {
    const apiKey = MAPTILER_CONFIG.API_KEY;

    if (!apiKey || apiKey === 'YOUR_MAPTILER_API_KEY_HERE') {
      return `
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body>
          <div style="padding: 20px; text-align:center;">
            <p>MapTiler API key not set. Add your API key in config/maptiler.js</p>
          </div>
        </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${lat}, ${lng}], 15);

          L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKey}', {
            attribution: '© MapTiler © OpenStreetMap contributors',
          }).addTo(map);

          L.marker([${lat}, ${lng}])
            .addTo(map)
            .bindPopup('📍 You are here<br>${lat.toFixed(6)}, ${lng.toFixed(6)}')
            .openPopup();

          L.circle([${lat}, ${lng}], { radius: 100, color: '#4285F4', fillOpacity: 0.1 }).addTo(map);
        </script>
      </body>
      </html>
    `;
  };

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission',
          'Location permission is required to show your position on the map.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const loadCategories = () => {
    const topLevelCategories = rawCategories.map(category => ({
      name: category.category,
      icon: getCategoryIcon(category.category),
    }));
    setCategories(topLevelCategories);
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Electronics': 'phone-portrait',
      'Fashion': 'shirt',
      'Home & Furniture': 'home',
      'Beauty & Personal Care': 'sparkles',
      'Grocery & Essentials': 'basket',
    };
    return iconMap[categoryName] || 'grid';
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryBusinessList', { category: category.name });
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Ionicons name="location" size={48} color="white" />
            <Title style={styles.welcomeTitle}>Find Businesses</Title>
            <Text style={styles.welcomeSubtitle}>Discover local businesses near you</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.mapCard}>
          <Card.Content>
            <Title style={styles.mapTitle}>📍 Your Location</Title>
            {location ? (
              <View style={styles.mapContainer}>
                <WebView
                  style={styles.map}
                  source={{ html: generateMapHTML(location.latitude, location.longitude) }}
                  javaScriptEnabled
                  domStorageEnabled
                />
              </View>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map" size={48} color="#6B7280" />
                <Text style={styles.mapPlaceholderText}>
                  {locationPermission ? 'Getting your location...' : 'Location permission required'}
                </Text>
                {!locationPermission && (
                  <Button mode="contained" onPress={getLocationPermission} style={styles.permissionButton}>
                    Enable Location
                  </Button>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.categoriesCard}>
          <Card.Content>
            <Title style={styles.categoriesTitle}>🏪 Browse Categories</Title>
            <Paragraph style={styles.categoriesSubtitle}>Explore businesses by category</Paragraph>
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => (
                <TouchableOpacity key={index} style={styles.categoryCard} onPress={() => handleCategoryPress(category)}>
                  <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.categoryGradient}>
                    <Ionicons name={category.icon} size={32} color="#3B82F6" />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingTop: 50, paddingBottom: 30 },
  header: { paddingHorizontal: 20 },
  welcomeContainer: { alignItems: 'center' },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 16, marginBottom: 8 },
  welcomeSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' },
  content: { padding: 20 },
  mapCard: { marginBottom: 20, elevation: 2, borderRadius: 12 },
  mapTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  mapContainer: { height: 200, borderRadius: 8, overflow: 'hidden' },
  map: { flex: 1 },
  mapPlaceholder: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8 },
  mapPlaceholderText: { fontSize: 16, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  permissionButton: { marginTop: 12 },
  categoriesCard: { marginBottom: 20, elevation: 2, borderRadius: 12 },
  categoriesTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  categoriesSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { width: '48%', marginBottom: 12, borderRadius: 8, overflow: 'hidden' },
  categoryGradient: { padding: 16, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 8, textAlign: 'center' },
});

export default DashboardScreen;