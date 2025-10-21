import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle, Text, TextStyle } from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    const sizeStyles = {
      sm: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
      md: { paddingVertical: 12, paddingHorizontal: 24, minHeight: 48 },
      lg: { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: '#FB923C',
        shadowColor: '#FB923C',
        shadowOpacity: 0.3,
      },
      secondary: {
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FB923C',
        shadowOpacity: 0,
      },
      ghost: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
      },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyles = {
      fontWeight: '700' as const,
      textAlign: 'center' as const,
    };

    const sizeTextStyles = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    const variantTextStyles = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#FFFFFF' },
      outline: { color: '#FB923C' },
      ghost: { color: '#FB923C' },
    };

    return {
      ...baseTextStyles,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getVariantStyles(), style]}
      activeOpacity={0.8}
      disabled={disabled || loading}
      {...props}
    >
      <Text style={[getTextStyles(), textStyle]}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

export default AnimatedButton;