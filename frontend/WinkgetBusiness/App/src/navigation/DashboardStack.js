import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CategoryBusinessListScreen from '../screens/dashboard/CategoryBusinessListScreen';

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
    </Stack.Navigator>
  );
};

export default DashboardStack;
