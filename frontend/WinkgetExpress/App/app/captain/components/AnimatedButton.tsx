import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  disabled = false,
  loading = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: '#F3F4F6',
          textColor: '#374151',
        };
      case 'success':
        return {
          backgroundColor: '#10B981',
          textColor: '#FFFFFF',
        };
      case 'danger':
        return {
          backgroundColor: '#EF4444',
          textColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          fontSize: 12,
          borderRadius: 8,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 14,
          borderRadius: 10,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          fontSize: 16,
          borderRadius: 12,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 14,
          borderRadius: 10,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderRadius: sizeStyles.borderRadius,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.text,
            {
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
              fontWeight: '600',
            },
          ]}
        >
          {loading ? 'Loading...' : title}
        </Text>
        {Icon && !loading && (
          <Icon size={16} color={variantStyles.textColor} style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: '600',
  },
});

