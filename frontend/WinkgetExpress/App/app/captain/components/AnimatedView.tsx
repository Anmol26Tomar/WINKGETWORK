import React from 'react';
import { View, ViewStyle } from 'react-native';

interface AnimatedViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce';
  onPress?: () => void;
  disabled?: boolean;
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  style,
  onPress,
  disabled = false,
}) => {
  const containerStyle: ViewStyle = {
    opacity: disabled ? 0.6 : 1,
  };

  if (onPress) {
    return (
      <View style={[containerStyle, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

export default AnimatedView;