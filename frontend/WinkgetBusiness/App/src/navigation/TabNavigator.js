import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Import screens
import DashboardStack from './DashboardStack';
import CategoriesStack from './CategoriesStack';
import CartScreen from '../screens/store/CartScreen';
import SidebarModal from '../screens/profile/SidebarModal';

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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Cart') {
            return <CartIconWithBadge focused={focused} color={color} size={size} totalItems={totalItems} />;
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EAF3FF',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
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
        name="Categories" 
        component={CategoriesStack}
        options={{
          tabBarLabel: 'Categories',
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
        name="More"
        component={View}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            setIsSidebarOpen(true);
          }
        })}
        options={{
          tabBarLabel: 'More',
        }}
      />
      {/* Sidebar modal overlay */}
      <Tab.Screen
        name="_SidebarHost"
        component={() => null}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
    {isSidebarOpen && (
      <SidebarModal
        key="sidebar"
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    )}
    </>
  );
};

export default TabNavigator;
