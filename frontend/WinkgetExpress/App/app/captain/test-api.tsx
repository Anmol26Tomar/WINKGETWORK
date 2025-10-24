import React from 'react';
import { View, StyleSheet } from 'react-native';
import APITestComponent from '@/app/captain/components/APITestComponent';

export default function APITestScreen() {
  return (
    <View style={styles.container}>
      <APITestComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
