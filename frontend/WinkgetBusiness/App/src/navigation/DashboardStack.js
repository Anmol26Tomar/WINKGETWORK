import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CategoryPage from '../screens/dashboard/CategoryPage';
import CategoryBusinessListScreen from '../screens/dashboard/CategoryBusinessListScreen';
import VendorStoreScreen from '../screens/dashboard/VendorStoreScreen';
import MyBusinessScreen from '../screens/business/MyBusinessScreen';
import MyStoreScreen from '../screens/store/MyStoreScreen';
import ProductDetailScreen from '../screens/store/ProductDetailScreen';
import AddressScreen from '../screens/store/AddressScreen';
import OrderSummaryScreen from '../screens/store/OrderSummaryScreen';
import PaymentScreen from '../screens/store/PaymentScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyOrdersScreen from '../screens/profile/MyOrdersScreen';
import WishlistScreen from '../screens/profile/WishlistScreen';
import MyAccountScreen from '../screens/profile/MyAccountScreen';

const Stack = createStackNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="CategoryPage" component={CategoryPage} />
      <Stack.Screen name="CategoryBusinessList" component={CategoryBusinessListScreen} />
      <Stack.Screen name="VendorStore" component={VendorStoreScreen} />
      <Stack.Screen name="MyBusiness" component={MyBusinessScreen} />
      <Stack.Screen name="MyStore" component={MyStoreScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="MyAccount" component={MyAccountScreen} />
    </Stack.Navigator>
  );
};

export default DashboardStack;
