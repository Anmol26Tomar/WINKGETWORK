import React from 'react';
import { View, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface AnimatedCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  disabled,
  ...props
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <TouchableOpacity
      style={[cardStyle, style]}
      activeOpacity={0.8}
      disabled={disabled}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

export default AnimatedCard;