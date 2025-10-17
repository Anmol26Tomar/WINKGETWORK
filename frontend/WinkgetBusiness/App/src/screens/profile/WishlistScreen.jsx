import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WishlistScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="heart" size={22} color="#007BFF" />
        <Text style={styles.title}>My Wishlist</Text>
      </View>
      <Text style={styles.note}>Wishlist UI coming soon.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { marginLeft: 8, fontSize: 18, fontWeight: '800', color: '#111827' },
  note: { color: '#6B7280' }
});

export default WishlistScreen;


