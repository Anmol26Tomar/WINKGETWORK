import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputKeyPressEvent,
} from 'react-native';

interface OTPInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
}

export default function OTPInput({
  value,
  onChangeText,
  length = 6,
}: OTPInputProps) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleChange = (text: string, index: number) => {
    const newChar = text.slice(-1);
    const newValue = digits.map((d, i) => (i === index ? newChar : d)).join('');
    onChangeText(newValue);

    if (newChar && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: TextInputKeyPressEvent, index: number) => {
    const key = e.nativeEvent.key; // ✅ Correct way to access the key
    if (key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      } else {
        const newValue = digits.map((d, i) => (i === index ? '' : d)).join('');
        onChangeText(newValue);
      }
    }
  };

  const handleFocus = (index: number) => {
    const firstEmptyIndex = digits.findIndex((d) => d === '');
    if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
      inputs.current[firstEmptyIndex]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          style={[styles.input, digit ? styles.filled : null]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
          returnKeyType="done"
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
    width: 48,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#666',
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  filled: {
    borderColor: '#fff',
  },
});
