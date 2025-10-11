import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph } from 'react-native-paper';

// Generic placeholder screens for future expansion
const SearchScreen = () => {
  return (
    <View style={styles.container}>
      <Title>Search</Title>
      <Paragraph>Search functionality will be implemented here</Paragraph>
    </View>
  );
};

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Title>Profile</Title>
      <Paragraph>User profile will be displayed here</Paragraph>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
});

export {
  SearchScreen,
  ProfileScreen,
};
