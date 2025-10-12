import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Import screens
import DashboardStack from './DashboardStack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CartScreen from '../screens/store/CartScreen';

// Import cart context
import { useCart } from '../context/CartContext';

const Tab = createBottomTabNavigator();

// Cart Icon with Badge Component
const CartIconWithBadge = ({ focused, color, size, totalItems }) => (
  <View style={{ position: 'relative' }}>
    <Ionicons 
      name={focused ? 'cart' : 'cart-outline'} 
      size={size} 
      color={color} 
    />
    {totalItems > 0 && (
      <View style={{
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
      }}>
        <Text style={{
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
        }}>
          {totalItems > 99 ? '99+' : totalItems}
        </Text>
      </View>
    )}
  </View>
);

const TabNavigator = () => {
  const { totalItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cart') {
            return <CartIconWithBadge focused={focused} color={color} size={size} totalItems={totalItems} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
