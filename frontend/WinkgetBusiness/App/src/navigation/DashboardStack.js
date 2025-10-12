import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CategoryBusinessListScreen from '../screens/dashboard/CategoryBusinessListScreen';
import MyBusinessScreen from '../screens/business/MyBusinessScreen';
import MyStoreScreen from '../screens/store/MyStoreScreen';
import ProductDetailScreen from '../screens/store/ProductDetailScreen';
import AddressScreen from '../screens/store/AddressScreen';
import OrderSummaryScreen from '../screens/store/OrderSummaryScreen';
import PaymentScreen from '../screens/store/PaymentScreen';

const Stack = createStackNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="CategoryBusinessList" component={CategoryBusinessListScreen} />
      <Stack.Screen name="MyBusiness" component={MyBusinessScreen} />
      <Stack.Screen name="MyStore" component={MyStoreScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
};

export default DashboardStack;
