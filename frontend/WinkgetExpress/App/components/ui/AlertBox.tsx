import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

export default function AlertBox({
  title,
  message,
  variant = 'info',
}: {
  title?: string;
  message: string;
  variant?: AlertVariant;
}) {
  const palette = getVariantStyles(variant);
  return (
    <View style={[styles.container, { borderColor: palette.border, backgroundColor: palette.background }]}> 
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.text }]}>{message}</Text>
    </View>
  );
}

function getVariantStyles(variant: AlertVariant) {
  switch (variant) {
    case 'error':
      return { background: Colors.background, backgroundColor: '#FFE7ED', border: Colors.danger, text: Colors.text } as any;
    case 'warning':
      return { background: Colors.background, backgroundColor: '#FFF7E6', border: '#E7B008', text: Colors.text } as any;
    case 'success':
      return { background: Colors.background, backgroundColor: '#EAF7EA', border: Colors.primary, text: Colors.text } as any;
    default:
      return { background: Colors.background, backgroundColor: Colors.card, border: Colors.border, text: Colors.text } as any;
  }
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.25,
    borderRadius: 14,
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
  },
});


