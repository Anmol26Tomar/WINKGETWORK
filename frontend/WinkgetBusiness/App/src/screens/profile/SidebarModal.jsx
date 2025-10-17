import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const SidebarModal = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const translateX = React.useRef(new Animated.Value(width)).current;
  const dimOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(dimOpacity, { toValue: 0.4, duration: 250, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: width, duration: 200, useNativeDriver: true }),
        Animated.timing(dimOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  const navigateAndClose = (screen, params) => {
    onClose?.();
    if (screen) navigation.navigate(screen, params);
  };

  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.dim, { opacity: dimOpacity }]}> 
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}> 
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.item} onPress={() => navigateAndClose('Profile')}>
          <Ionicons name="person-circle" size={22} color="#007BFF" style={styles.icon} />
          <Text style={styles.itemText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => navigateAndClose('MyOrders')}>
          <Ionicons name="receipt" size={22} color="#007BFF" style={styles.icon} />
          <Text style={styles.itemText}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => navigateAndClose('Wishlist')}>
          <Ionicons name="heart" size={22} color="#007BFF" style={styles.icon} />
          <Text style={styles.itemText}>My Wishlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => navigateAndClose('MyAccount')}>
          <Ionicons name="settings" size={22} color="#007BFF" style={styles.icon} />
          <Text style={styles.itemText}>My Account</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#EF4444" style={styles.icon} />
          <Text style={[styles.itemText, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  icon: { marginRight: 12 },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 12,
  },
});

export default SidebarModal;


