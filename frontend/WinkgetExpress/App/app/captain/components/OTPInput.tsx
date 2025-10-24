import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface OTPInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
}

export default function OTPInput({ value, onChangeText, length = 6 }: OTPInputProps) {
  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleDigitChange = (digit: string, index: number) => {
    const newValue = digits.map((d, i) => i === index ? digit : d).join('');
    onChangeText(newValue);
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          style={styles.input}
          value={digit}
          onChangeText={(text) => handleDigitChange(text, index)}
          keyboardType="numeric"
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  input: {
    width: 45,
    height: 45,
    backgroundColor: '#555',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#777',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

