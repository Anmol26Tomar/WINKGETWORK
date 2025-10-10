import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Title, Paragraph } from 'react-native-paper';

const VendorListScreen = ({ route }) => {
  const { business } = route.params;

  return (
    <View style={styles.container}>
      <Title>Vendors for {business.name}</Title>
      <Paragraph>Vendor list will be displayed here</Paragraph>
    </View>
  );
};

const ProductListScreen = ({ route }) => {
  const { business } = route.params;

  return (
    <View style={styles.container}>
      <Title>Products for {business.name}</Title>
      <Paragraph>Product list will be displayed here</Paragraph>
    </View>
  );
};

const VendorDetailScreen = ({ route }) => {
  const { vendor } = route.params;

  return (
    <View style={styles.container}>
      <Title>{vendor.storeName}</Title>
      <Paragraph>Vendor details will be displayed here</Paragraph>
    </View>
  );
};

const ProductDetailScreen = ({ route }) => {
  const { product } = route.params;

  return (
    <View style={styles.container}>
      <Title>{product.name}</Title>
      <Paragraph>Product details will be displayed here</Paragraph>
    </View>
  );
};

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
  VendorListScreen,
  ProductListScreen,
  VendorDetailScreen,
  ProductDetailScreen,
  SearchScreen,
  ProfileScreen,
};
