import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, onSearchPress }) => {
  const handleSearchPress = () => {
    console.log('SearchBar: Search button pressed');
    if (onSearchPress) {
      onSearchPress(value);
    } else {
      console.log('SearchBar: onSearchPress prop not provided');
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="mic-outline" size={18} color="#6B7280" style={styles.leftIcon} />
      <TextInput
        style={styles.input}
        placeholder="Search for businesses or categories..."
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        editable={true}
      />
      <TouchableOpacity 
        onPress={handleSearchPress} 
        style={styles.searchButton}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={18} color="#007BFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  leftIcon: { marginRight: 8 },
  searchButton: { 
    marginLeft: 8, 
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EAF3FF',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
});

export default SearchBar;


