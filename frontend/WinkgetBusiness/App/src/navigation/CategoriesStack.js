import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import CategoryPage from '../screens/dashboard/CategoryPage';
import CategoryBusinessListScreen from '../screens/dashboard/CategoryBusinessListScreen';
import MyBusinessScreen from '../screens/business/MyBusinessScreen';

const Stack = createStackNavigator();

const CategoriesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CategoryPage" component={CategoryPage} />
      <Stack.Screen name="CategoryBusinessList" component={CategoryBusinessListScreen} />
      <Stack.Screen name="MyBusiness" component={MyBusinessScreen} />
    </Stack.Navigator>
  );
};

export default CategoriesStack;
