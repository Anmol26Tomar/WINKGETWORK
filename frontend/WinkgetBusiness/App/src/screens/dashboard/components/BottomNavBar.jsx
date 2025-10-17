import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNavBar = ({ current = 'home', onPress }) => {
  const items = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'cart', icon: 'bag', label: 'Cart' },
    { key: 'store', icon: 'storefront', label: 'My Store' },
    { key: 'profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const focused = current === item.key;
        return (
          <TouchableOpacity key={item.key} style={styles.tab} activeOpacity={0.9} onPress={() => onPress?.(item.key)}>
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? item.icon : `${item.icon}-outline`} size={20} color={focused ? '#fff' : '#007BFF'} />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tab: {
    alignItems: 'center',
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconPillActive: {
    backgroundColor: '#007BFF',
  },
  label: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  labelActive: {
    color: '#111827',
  },
});

export default BottomNavBar;


